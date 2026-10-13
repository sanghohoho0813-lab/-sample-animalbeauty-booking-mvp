import { describe, expect, it } from "vitest";
import { discountOf } from "@/lib/coupons";
import { COUPONS, getSalonById, getServiceById, SEED_PETS } from "@/lib/data";
import { isClosedDay, startTimesFor } from "@/lib/slots";
import {
  loadDb,
  mergeSeedPets,
  newId,
  parseStoredDb,
  seedBookings,
  settlePastBookings,
} from "@/lib/db-core";
import { priceAt } from "@/lib/pricing";
import type { Booking, Pet } from "@/lib/types";

const NOW = new Date(2030, 0, 10, 12, 0);

const validBooking = seedBookings(NOW)[0];
const customPet: Pet = {
  id: "pet-custom",
  name: "두부",
  species: "dog",
  breed: "비숑",
  age: 1,
  weight: 5,
  emoji: "🐶",
};

describe("parseStoredDb — 저장 데이터 검증", () => {
  it("최상위 모양이 틀리면 null", () => {
    expect(parseStoredDb(null)).toBeNull();
    expect(parseStoredDb("hello")).toBeNull();
    expect(parseStoredDb({ pets: "x", bookings: [] })).toBeNull();
  });

  it("깨진 레코드만 버리고 나머지는 살린다", () => {
    const parsed = parseStoredDb({
      pets: [customPet, { id: "pet-bad", name: "" }, null],
      bookings: [
        validBooking,
        { ...validBooking, id: "bk-bad", date: "10/9" },
        { ...validBooking, id: "bk-bad2", status: "unknown" },
      ],
      favorites: ["salon-1", "salon-999", 3],
      reviews: [
        {
          id: "r1",
          salonId: "salon-1",
          author: "a",
          petName: "p",
          rating: 9,
          content: "",
          date: "2030-01-01",
          serviceName: "",
        },
      ],
    })!;
    expect(parsed.pets.map((p) => p.id)).toEqual(["pet-custom"]);
    expect(parsed.bookings.map((b) => b.id)).toEqual([validBooking.id]);
    expect(parsed.favorites).toEqual(["salon-1"]);
    expect(parsed.reviews).toEqual([]); // 별점 범위를 벗어난 후기
  });

  it("같은 id가 여러 번 저장돼 있으면 하나만 남긴다", () => {
    const parsed = parseStoredDb({
      pets: [customPet, customPet],
      bookings: [validBooking, validBooking],
      favorites: ["salon-1", "salon-1"],
    })!;
    expect(parsed.pets).toHaveLength(1);
    expect(parsed.bookings).toHaveLength(1);
    expect(parsed.favorites).toEqual(["salon-1"]);
  });

  it("reviews 필드가 없던 이전 버전 데이터도 읽는다", () => {
    expect(parseStoredDb({ pets: [], bookings: [], favorites: [] })?.reviews).toEqual([]);
  });
});

describe("loadDb", () => {
  it("저장된 값이 없거나 JSON이 깨졌으면 시드 데이터로 시작한다", () => {
    for (const raw of [null, "", "{not json", "[]"]) {
      const db = loadDb(raw, NOW);
      expect(db.pets).toEqual(SEED_PETS);
      expect(db.bookings).toHaveLength(6);
    }
  });

  it("데모 아이는 사진만 최신으로, 사용자가 고친 이름은 유지하고 등록한 아이도 그대로", () => {
    const edited = { ...SEED_PETS[0], name: "콩이콩이", image: "/old.png" };
    const db = loadDb(
      JSON.stringify({ pets: [edited, customPet], bookings: [], favorites: [] }),
      NOW
    );
    expect(db.pets[0]).toMatchObject({ name: "콩이콩이", image: SEED_PETS[0].image });
    expect(db.pets.at(-1)).toEqual(customPet);
  });

  it("예약의 깨진 선택 필드(요청사항·쿠폰)만 버리고 예약은 살린다", () => {
    const broken = { ...validBooking, request: { tags: "x" }, couponId: "cpn-없음" };
    const db = loadDb(JSON.stringify({ pets: [], bookings: [broken], favorites: [] }), NOW);
    expect(db.bookings).toHaveLength(1);
    expect(db.bookings[0].request).toBeUndefined();
    expect(db.bookings[0].couponId).toBeUndefined();
  });
});

describe("시드 예약", () => {
  const bookings = seedBookings(NOW);

  it("가격·할인이 실제 규칙(미용실별 가격·쿠폰)과 일치한다", () => {
    for (const b of bookings) {
      expect(b.price).toBe(priceAt(getServiceById(b.serviceId)!, getSalonById(b.salonId)));
      const coupon = COUPONS.find((c) => c.id === b.couponId);
      expect(b.discount).toBe(coupon ? discountOf(coupon, b.price) : 0);
      expect(b.total).toBe(b.price - b.discount);
    }
  });

  it("어느 요일에 열어도 예약은 매장 영업일·영업시간 안에 있다", () => {
    for (let d = 0; d < 7; d += 1) {
      const now = new Date(2030, 0, 6 + d, 12, 0); // 일~토
      for (const b of seedBookings(now)) {
        const salon = getSalonById(b.salonId)!;
        expect(isClosedDay(b.date, salon)).toBe(false);
        const duration = getServiceById(b.serviceId)!.durationMin;
        expect(startTimesFor(salon, duration)).toContain(b.time);
      }
    }
  });

  it("예정 예약은 미래, 지난 예약은 과거 날짜", () => {
    const today = "2030-01-10";
    for (const b of bookings) {
      if (b.status === "confirmed") expect(b.date > today).toBe(true);
      else expect(b.date < today).toBe(true);
    }
  });

  it("모든 예약의 미용사는 그 미용실 소속이다", async () => {
    const { GROOMERS } = await import("@/lib/data");
    for (const b of bookings) {
      expect(GROOMERS.find((g) => g.id === b.groomerId)?.salonId).toBe(b.salonId);
    }
  });
});

describe("settlePastBookings", () => {
  const at = (date: string, time: string, status: Booking["status"] = "confirmed") => ({
    ...validBooking,
    date,
    time,
    status,
  });

  it("방문 시각이 지난 예정 예약은 이용 완료로", () => {
    const [b] = settlePastBookings([at("2030-01-10", "11:00")], NOW);
    expect(b.status).toBe("completed");
  });

  it("오늘이라도 아직 시간이 안 됐으면 그대로", () => {
    const [b] = settlePastBookings([at("2030-01-10", "14:00")], NOW);
    expect(b.status).toBe("confirmed");
  });

  it("취소된 예약은 건드리지 않는다", () => {
    const [b] = settlePastBookings([at("2030-01-01", "10:00", "cancelled")], NOW);
    expect(b.status).toBe("cancelled");
  });
});

describe("mergeSeedPets / newId", () => {
  it("사용자가 지운 데모 아이는 다시 살리지 않는다", () => {
    expect(mergeSeedPets([customPet]).map((p) => p.id)).toEqual(["pet-custom"]);
  });

  it("연속으로 만들어도 id가 겹치지 않는다", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId("bk")));
    expect(ids.size).toBe(500);
  });
});
