import { describe, expect, it } from "vitest";
import { seedBookings } from "@/lib/db-core";
import { petInsights } from "@/lib/pet-insights";
import type { Booking } from "@/lib/types";

const base = seedBookings(new Date(2030, 0, 10, 12, 0))[3]; // 콩이 · 살롱 드 포우 · 김나연
const visit = (id: string, date: string, over: Partial<Booking> = {}): Booking => ({
  ...base,
  id,
  date,
  status: "completed",
  ...over,
});

describe("아이별 이용 패턴", () => {
  it("이용 완료만 세고, 자주 가는 미용실과 그 미용실의 단골 미용사를 고른다", () => {
    const list = [
      visit("a", "2029-09-01"),
      visit("b", "2029-10-15", { salonId: "salon-2", groomerId: "grm-4" }),
      visit("c", "2029-11-20", { groomerId: "grm-1" }),
      visit("d", "2029-12-30", { groomerId: "grm-1" }),
      visit("x", "2030-01-02", { status: "cancelled" }),
      visit("y", "2030-02-01", { status: "confirmed", salonId: "salon-2" }),
    ];
    const r = petInsights("pet-1", list);
    expect(r.visits).toBe(4);
    expect(r.favoriteSalon?.salon.id).toBe("salon-1");
    expect(r.favoriteSalon?.count).toBe(3);
    expect(r.favoriteGroomer?.id).toBe("grm-1");
    expect(r.lastAtFavorite?.id).toBe("d");
  });

  it("횟수가 같으면 최근에 간 미용실", () => {
    const r = petInsights("pet-1", [
      visit("a", "2029-09-01"),
      visit("b", "2029-10-15", { salonId: "salon-2", groomerId: "grm-4" }),
    ]);
    expect(r.favoriteSalon?.salon.id).toBe("salon-2");
  });

  it("두 번 이상 받았을 때만 평균 미용 간격을 낸다", () => {
    expect(petInsights("pet-1", [visit("a", "2029-09-01")]).averageCycleDays).toBeNull();
    const r = petInsights("pet-1", [
      visit("a", "2029-09-01"),
      visit("b", "2029-10-13"),
      visit("c", "2029-11-24"),
    ]);
    expect(r.averageCycleDays).toBe(42);
  });

  it("기록이 없으면 비어 있다", () => {
    expect(petInsights("pet-1", [])).toMatchObject({
      visits: 0,
      favoriteSalon: null,
      favoriteGroomer: null,
      lastAtFavorite: null,
      averageCycleDays: null,
    });
  });
});
