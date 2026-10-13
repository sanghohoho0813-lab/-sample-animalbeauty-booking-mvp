import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT, parseDraft } from "@/lib/booking-context";
import { quote } from "@/lib/checkout";
import {
  couponBlocker,
  discountOf,
  isFirstVisit,
  resolveCoupon,
  usableCoupons,
} from "@/lib/coupons";
import { COUPONS } from "@/lib/data";
import { buildIcs } from "@/lib/ics";
import {
  bookingStage,
  canModify,
  daysUntil,
  endTimeOf,
  nextGroomingDate,
  petHistory,
} from "@/lib/lifecycle";
import { keywordSummary, maskName, relativeDay } from "@/lib/reviews";
import { getSalonById } from "@/lib/data";
import type { Booking } from "@/lib/types";

const NOW = new Date(2030, 0, 10, 12, 0);
const cpn = (id: string) => COUPONS.find((c) => c.id === id)!;

const b = (patch: Partial<Booking>): Booking => ({
  id: "bk-1",
  bookingNo: "PB-1",
  petId: "pet-1",
  serviceId: "svc-1",
  salonId: "salon-1",
  groomerId: "grm-1",
  date: "2030-01-15",
  time: "10:00",
  price: 45000,
  discount: 0,
  total: 45000,
  status: "confirmed",
  createdAt: NOW.toISOString(),
  ...patch,
});

describe("쿠폰", () => {
  it("정률·정액 할인 금액", () => {
    expect(discountOf(cpn("cpn-1"), 45000)).toBe(4500);
    expect(discountOf(cpn("cpn-2"), 45000)).toBe(5000);
    expect(discountOf(cpn("cpn-2"), 3000)).toBe(3000); // 금액보다 크게 깎지 않는다
  });

  it("첫 방문 쿠폰은 한 번도 가지 않은 미용실에서만 (취소한 예약은 방문으로 치지 않는다)", () => {
    const history = [
      b({ salonId: "salon-1" }),
      b({ id: "bk-2", salonId: "salon-2", status: "cancelled" }),
    ];
    expect(isFirstVisit("salon-1", history)).toBe(false);
    expect(isFirstVisit("salon-2", history)).toBe(true);
    const ctx = { serviceId: "svc-1", salonId: "salon-1", bookings: history };
    expect(couponBlocker(cpn("cpn-2"), ctx)).toMatch(/방문한/);
  });

  it("서비스 전용 쿠폰은 그 서비스에서만", () => {
    const ctx = { serviceId: "svc-1", salonId: "salon-3", bookings: [] };
    expect(couponBlocker(cpn("cpn-3"), ctx)).toMatch(/다른 서비스/);
    expect(couponBlocker(cpn("cpn-3"), { ...ctx, serviceId: "svc-3" })).toBeNull();
  });

  it("1회용 쿠폰은 쓰면 소진되고, 그 예약을 취소하면 다시 쓸 수 있다", () => {
    const ctx = (status: Booking["status"]) => ({
      serviceId: "svc-3",
      salonId: "salon-4",
      bookings: [b({ couponId: "cpn-3", status })],
    });
    expect(couponBlocker(cpn("cpn-3"), ctx("confirmed"))).toMatch(/이미 사용/);
    expect(couponBlocker(cpn("cpn-3"), ctx("cancelled"))).toBeNull();
    // 멤버 할인은 몇 번이든
    expect(
      couponBlocker(cpn("cpn-1"), { ...ctx("confirmed"), bookings: [b({ couponId: "cpn-1" })] })
    ).toBeNull();
  });

  it("자동 선택은 가장 큰 할인, '사용 안 함'은 할인 없음", () => {
    const ctx = { serviceId: "svc-1", salonId: "salon-2", bookings: [] };
    // 멍뭉살롱 기본 미용 40,000원: 10% = 4,000 < 첫 방문 5,000
    expect(usableCoupons(40000, ctx)[0].id).toBe("cpn-2");
    expect(resolveCoupon("auto", 40000, ctx)?.id).toBe("cpn-2");
    expect(resolveCoupon("none", 40000, ctx)).toBeNull();
    expect(resolveCoupon("cpn-1", 40000, ctx)?.id).toBe("cpn-1");
    // 쓸 수 없는 쿠폰을 골라두었으면 자동으로 바꾼다
    expect(resolveCoupon("cpn-3", 40000, ctx)?.id).toBe("cpn-2");
  });

  it("quote: 미용실별 가격 + 쿠폰", () => {
    const q = quote({ serviceId: "svc-1", salonId: "salon-5", couponId: "auto" }, [
      b({ salonId: "salon-5" }),
    ]);
    expect(q).toMatchObject({ price: 35000, discount: 3500, total: 31500 });
    expect(q.coupon?.id).toBe("cpn-1");
  });
});

describe("예약 이후 단계", () => {
  it("남은 날짜에 따라 단계가 바뀐다", () => {
    expect(bookingStage(b({ date: "2030-01-15" }), NOW)).toBe("upcoming");
    expect(bookingStage(b({ date: "2030-01-11" }), NOW)).toBe("tomorrow");
    expect(bookingStage(b({ date: "2030-01-10" }), NOW)).toBe("today");
    expect(bookingStage(b({ status: "completed" }), NOW)).toBe("done");
    expect(bookingStage(b({ status: "cancelled" }), NOW)).toBe("cancelled");
    expect(daysUntil("2030-01-15", NOW)).toBe(5);
  });

  it("변경·취소는 방문 전날까지", () => {
    expect(canModify(b({ date: "2030-01-11" }), NOW)).toBe(true);
    expect(canModify(b({ date: "2030-01-10" }), NOW)).toBe(false);
    expect(canModify(b({ status: "completed" }), NOW)).toBe(false);
  });

  it("끝나는(픽업) 시각 = 시작 + 소요 시간", () => {
    expect(endTimeOf({ time: "10:00", serviceId: "svc-1" })).toBe("11:30");
    expect(endTimeOf({ time: "14:00", serviceId: "svc-3" })).toBe("16:30");
  });

  it("아이별 지난 이용·다가오는 예약", () => {
    const list = [
      b({ id: "a", status: "completed", date: "2029-12-01" }),
      b({ id: "c", status: "completed", date: "2029-12-20" }),
      b({ id: "d", status: "confirmed", date: "2030-01-20" }),
      b({ id: "e", status: "confirmed", date: "2030-01-15" }),
      b({ id: "f", petId: "pet-2", status: "completed", date: "2030-01-01" }),
    ];
    const h = petHistory("pet-1", list);
    expect(h.last?.id).toBe("c");
    expect(h.upcoming?.id).toBe("e");
    expect(h.visits).toBe(2);
  });

  it("다음 미용 추천일 = 지난 미용일 + 서비스 권장 주기", () => {
    expect(nextGroomingDate({ date: "2030-01-01", serviceId: "svc-1" })).toBe("2030-02-12"); // 6주
    expect(nextGroomingDate({ date: "2030-01-01", serviceId: "svc-4" })).toBe("2030-01-22"); // 3주
  });
});

describe("캘린더 내보내기", () => {
  it("시작·종료·장소·하루 전 알림이 들어간 일정", () => {
    const ics = buildIcs(b({}), {
      title: "콩이 기본 미용 · 살롱 드 포우",
      location: "서울 강남구 청담동 12-3",
      description: "미용사 이수진",
      endTime: "11:30",
    });
    expect(ics).toContain("DTSTART;TZID=Asia/Seoul:20300115T100000");
    expect(ics).toContain("DTEND;TZID=Asia/Seoul:20300115T113000");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("LOCATION:서울 강남구 청담동 12-3");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});

describe("후기 표시", () => {
  it("다른 사람 이름은 가운데를 가린다", () => {
    expect(maskName("박서준")).toBe("박*준");
    expect(maskName("남궁민수")).toBe("남**수");
    expect(maskName("김팀장")).toBe("김팀장"); // 내 후기
  });

  it("상대 날짜", () => {
    expect(relativeDay("2030-01-10", NOW)).toBe("오늘");
    expect(relativeDay("2030-01-09", NOW)).toBe("어제");
    expect(relativeDay("2030-01-05", NOW)).toBe("5일 전");
    expect(relativeDay("2029-12-25", NOW)).toBe("2주 전");
  });

  it("후기 요약 키워드에 내 후기 키워드를 더한다", () => {
    const salon = getSalonById("salon-5")!;
    const summary = keywordSummary(salon, [
      {
        id: "r",
        salonId: "salon-5",
        author: "김팀장",
        petName: "몽이",
        rating: 5,
        content: "",
        date: "2030-01-01",
        serviceName: "",
        keywords: ["친절해요", "새 키워드"],
      },
    ]);
    expect(summary.find((k) => k.label === "친절해요")?.count).toBe(62);
    expect(summary.find((k) => k.label === "새 키워드")?.count).toBe(1);
  });
});

describe("예약 선택값 복원", () => {
  it("이전 버전·깨진 값은 기본값으로", () => {
    expect(parseDraft(null)).toEqual(EMPTY_DRAFT);
    expect(parseDraft("{oops")).toEqual(EMPTY_DRAFT);
    const old = parseDraft(
      JSON.stringify({ petId: "pet-1", useCoupon: true, requestTags: [1, "발톱은 짧게"] })
    );
    expect(old).toMatchObject({ petId: "pet-1", couponId: "auto", requestTags: ["발톱은 짧게"] });
  });
});
