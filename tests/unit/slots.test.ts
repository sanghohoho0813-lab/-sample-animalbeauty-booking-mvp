import { describe, expect, it } from "vitest";
import {
  earliestSlot,
  earliestSlotAtSalon,
  getSlots,
  isClosedDay,
  isDayFullyBooked,
  isSlotBookable,
  startTimesFor,
  suggestAlternatives,
} from "@/lib/slots";
import { getSalonById } from "@/lib/data";
import type { Booking } from "@/lib/types";

// 2030-01-10(목) 08:00 — 테스트가 실행되는 날짜와 무관하게 고정
const NOW = new Date(2030, 0, 10, 8, 0);
const TODAY = "2030-01-10";
const FUTURE = "2030-01-15"; // 화요일
const MONDAY = "2030-01-14";

const booking = (patch: Partial<Booking>): Booking => ({
  id: "bk-x",
  bookingNo: "PB-x",
  petId: "pet-1",
  serviceId: "svc-1", // 90분
  salonId: "salon-1",
  groomerId: "grm-1",
  date: FUTURE,
  time: "10:00",
  price: 45000,
  discount: 0,
  total: 45000,
  status: "confirmed",
  createdAt: NOW.toISOString(),
  ...patch,
});

const open = (slots: ReturnType<typeof getSlots>) =>
  slots.filter((s) => s.available).map((s) => s.time);

describe("영업시간 기반 시작 시각", () => {
  const salon1 = getSalonById("salon-1")!; // 09:00 - 19:00
  const salon3 = getSalonById("salon-3")!; // 09:30 - 18:30
  const salon6 = getSalonById("salon-6")!; // 11:00 - 20:00

  it("정시마다, 점심시간(12시)은 빼고 만든다", () => {
    expect(startTimesFor(salon1)).toEqual([
      "09:00",
      "10:00",
      "11:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
    ]);
  });

  it("30분에 여는 매장은 다음 정시부터", () => {
    expect(startTimesFor(salon3)[0]).toBe("10:00");
  });

  it("늦게 여는 매장에는 오전 이른 시간이 없다", () => {
    expect(startTimesFor(salon6)[0]).toBe("11:00");
  });

  it("미용이 영업 종료 전에 끝나는 시각까지만 (19시 마감 · 150분 → 16시가 마지막)", () => {
    expect(startTimesFor(salon1, 150).at(-1)).toBe("16:00");
    expect(startTimesFor(salon1, 90).at(-1)).toBe("17:00");
  });
});

describe("getSlots", () => {
  it("정기 휴무일에는 예약 시간이 없다", () => {
    expect(isClosedDay(MONDAY, getSalonById("salon-1")!)).toBe(true);
    expect(getSlots(MONDAY, "grm-1", [], NOW)).toEqual([]);
    expect(isDayFullyBooked(MONDAY, "grm-1", [], NOW)).toBe(true);
  });

  it("지난 날짜는 전부 마감", () => {
    expect(open(getSlots("2030-01-09", "grm-1", [], NOW))).toEqual([]);
  });

  it("당일 예약은 시작 1시간 전까지만 받는다", () => {
    const at1330 = new Date(2030, 0, 10, 13, 30);
    const times = getSlots(TODAY, "grm-1", [], at1330);
    expect(times.find((s) => s.time === "14:00")?.available).toBe(false);
    expect(open(times).every((t) => t >= "15:00")).toBe(true);
  });

  it("같은 날 같은 결과 — 다른 고객 예약 표시는 결정적이다", () => {
    expect(getSlots(FUTURE, "grm-3", [], NOW)).toEqual(getSlots(FUTURE, "grm-3", [], NOW));
  });

  it("서비스 길이와 상관없이 같은 시각은 같은 상태다", () => {
    const short = getSlots(FUTURE, "grm-1", [], NOW, { petId: "pet-9", durationMin: 30 });
    const long = getSlots(FUTURE, "grm-1", [], NOW, { petId: "pet-9", durationMin: 120 });
    for (const s of long) expect(short.find((x) => x.time === s.time)?.available).toBe(s.available);
  });

  it("같은 미용사의 확정 예약 시간은 막고, 취소된 예약은 다시 연다", () => {
    expect(isSlotBookable(FUTURE, "14:00", "grm-1", [booking({ time: "14:00" })], NOW)).toBe(false);
    const base = isSlotBookable(FUTURE, "14:00", "grm-1", [], NOW);
    const cancelled = [booking({ time: "14:00", status: "cancelled" })];
    expect(isSlotBookable(FUTURE, "14:00", "grm-1", cancelled, NOW)).toBe(base);
  });

  it("다른 미용사의 예약은 영향을 주지 않는다", () => {
    const others = [booking({ groomerId: "grm-2", time: "14:00" })];
    expect(getSlots(FUTURE, "grm-1", others, NOW)).toEqual(getSlots(FUTURE, "grm-1", [], NOW));
  });

  it("모든 시간이 예약되면 마감", () => {
    const all = startTimesFor(getSalonById("salon-1")!).map((time, i) =>
      booking({ id: `bk-${i}`, time })
    );
    expect(isDayFullyBooked(FUTURE, "grm-1", all, NOW)).toBe(true);
  });
});

describe("같은 아이의 시간 겹침", () => {
  // 10:00 시작 90분 예약 → 10:00~11:30 사용 중
  const existing = [booking({ groomerId: "grm-9", time: "10:00" })];

  it("겹치는 슬롯은 petBusy로 막는다", () => {
    const slots = getSlots(FUTURE, "grm-1", existing, NOW, { petId: "pet-1", durationMin: 30 });
    expect(slots.find((s) => s.time === "10:00")).toMatchObject({
      available: false,
      petBusy: true,
    });
    expect(slots.find((s) => s.time === "11:00")).toMatchObject({
      available: false,
      petBusy: true,
    });
  });

  it("새 예약이 길어서 기존 예약 시작과 겹쳐도 막는다 (09:00 + 120분)", () => {
    const slots = getSlots(FUTURE, "grm-1", existing, NOW, { petId: "pet-1", durationMin: 120 });
    expect(slots.find((s) => s.time === "09:00")?.petBusy).toBe(true);
  });

  it("끝나는 시각과 시작 시각이 맞닿는 것은 겹침이 아니다 (09:00 + 60분)", () => {
    const slots = getSlots(FUTURE, "grm-1", existing, NOW, { petId: "pet-1", durationMin: 60 });
    expect(slots.find((s) => s.time === "09:00")?.petBusy).toBeFalsy();
  });

  it("다른 아이의 예약은 상관없다", () => {
    const slots = getSlots(FUTURE, "grm-1", existing, NOW, { petId: "pet-2", durationMin: 120 });
    expect(slots.some((s) => s.petBusy)).toBe(false);
  });
});

describe("가장 빠른 시간·대안 시간", () => {
  it("가장 빠른 시간은 실제로 예약 가능한 시간이다", () => {
    const slot = earliestSlot(["grm-1", "grm-2"], [], NOW)!;
    expect(slot).not.toBeNull();
    expect(isSlotBookable(slot.date, slot.time, slot.groomerId, [], NOW)).toBe(true);
    expect(slot.date >= TODAY).toBe(true);
  });

  it("매장의 가장 빠른 시간은 그 매장 미용사 중에서 찾는다", () => {
    const slot = earliestSlotAtSalon("salon-6", [], NOW)!;
    expect(["grm-12", "grm-13"]).toContain(slot.groomerId);
    expect(slot.time >= "11:00").toBe(true);
  });

  it("막힌 시간의 대안은 같은 날 가까운 시간부터", () => {
    const taken = [booking({ time: "14:00" })];
    const alts = suggestAlternatives(FUTURE, "14:00", "grm-1", taken, NOW);
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.every((a) => a.date === FUTURE && a.time !== "14:00")).toBe(true);
    for (const a of alts) expect(isSlotBookable(a.date, a.time, "grm-1", taken, NOW)).toBe(true);
  });

  it("그날이 모두 막혔으면 다음 가능한 날을 하나 제안한다", () => {
    const alts = suggestAlternatives(MONDAY, "10:00", "grm-1", [], NOW);
    expect(alts).toHaveLength(1);
    expect(alts[0].date > MONDAY).toBe(true);
  });
});
