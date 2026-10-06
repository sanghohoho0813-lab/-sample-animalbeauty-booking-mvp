import { describe, expect, it } from "vitest";
import { TIME_SLOTS } from "@/lib/data";
import { getSlots, isDayFullyBooked, isSlotBookable } from "@/lib/slots";
import type { Booking } from "@/lib/types";

// 2030-01-10(목) 08:00 — 테스트가 실행되는 날짜와 무관하게 고정
const NOW = new Date(2030, 0, 10, 8, 0);
const TODAY = "2030-01-10";
const FUTURE = "2030-01-15";

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

describe("getSlots", () => {
  it("영업 시간표의 모든 슬롯을 순서대로 돌려준다", () => {
    expect(getSlots(FUTURE, "grm-1", [], NOW).map((s) => s.time)).toEqual(TIME_SLOTS);
  });

  it("지난 날짜는 전부 마감", () => {
    expect(open(getSlots("2030-01-09", "grm-1", [], NOW))).toEqual([]);
  });

  it("오늘은 지금 시각 이후만 열린다", () => {
    const afternoon = new Date(2030, 0, 10, 13, 30);
    const times = open(getSlots(TODAY, "grm-1", [], afternoon));
    expect(times.every((t) => Number(t.slice(0, 2)) > 13)).toBe(true);
  });

  it("같은 날 같은 결과 — 데모 마감 슬롯은 결정적이다", () => {
    expect(getSlots(FUTURE, "grm-3", [], NOW)).toEqual(getSlots(FUTURE, "grm-3", [], NOW));
  });

  it("같은 미용사의 확정 예약 시간은 막고, 취소된 예약은 다시 연다", () => {
    const taken = [booking({ time: "14:00" })];
    expect(isSlotBookable(FUTURE, "14:00", "grm-1", taken, NOW)).toBe(false);
    const cancelled = [booking({ time: "14:00", status: "cancelled" })];
    const base = isSlotBookable(FUTURE, "14:00", "grm-1", [], NOW);
    expect(isSlotBookable(FUTURE, "14:00", "grm-1", cancelled, NOW)).toBe(base);
  });

  it("다른 미용사의 예약은 영향을 주지 않는다", () => {
    const others = [booking({ groomerId: "grm-2", time: "14:00" })];
    expect(getSlots(FUTURE, "grm-1", others, NOW)).toEqual(getSlots(FUTURE, "grm-1", [], NOW));
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

  it("새 예약이 길어서 기존 예약 시작과 겹쳐도 막는다 (09:00 + 120분 → 11:00)", () => {
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

describe("isDayFullyBooked", () => {
  it("지난 날은 마감, 먼 미래의 평일은 열려 있다", () => {
    expect(isDayFullyBooked("2030-01-01", "grm-1", [], NOW)).toBe(true);
    expect(isDayFullyBooked(FUTURE, "grm-1", [], NOW)).toBe(false);
  });

  it("모든 슬롯이 예약되면 마감", () => {
    const all = TIME_SLOTS.map((time, i) => booking({ id: `bk-${i}`, time }));
    expect(isDayFullyBooked(FUTURE, "grm-1", all, NOW)).toBe(true);
  });
});
