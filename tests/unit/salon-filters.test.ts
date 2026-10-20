import { describe, expect, it } from "vitest";
import { SALONS } from "@/lib/data";
import {
  activeFilterCount,
  amenityOptions,
  EMPTY_FILTERS,
  matchesFilters,
  PRICE_RANGES,
} from "@/lib/salon-filters";

const pick = (f: Partial<typeof EMPTY_FILTERS>) =>
  SALONS.filter((s) => matchesFilters(s, { ...EMPTY_FILTERS, ...f })).map((s) => s.id);

describe("미용실 상세 필터", () => {
  it("필터가 없으면 모두", () => {
    expect(pick({})).toHaveLength(SALONS.length);
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("편의시설은 고른 것을 모두 갖춘 곳만", () => {
    expect(pick({ amenities: ["parking"] })).toEqual(
      SALONS.filter((s) => s.amenities.includes("parking")).map((s) => s.id)
    );
    const both = pick({ amenities: ["parking", "photo_report"] });
    for (const id of both) {
      const s = SALONS.find((x) => x.id === id)!;
      expect(s.amenities).toEqual(expect.arrayContaining(["parking", "photo_report"]));
    }
  });

  it("가격 구간은 겹치지 않고 모든 매장을 나눠 담는다", () => {
    const parts = PRICE_RANGES.map((r) => pick({ price: r.key }));
    expect(parts.flat().sort()).toEqual(SALONS.map((s) => s.id).sort());
    for (const id of pick({ price: "under40" })) {
      expect(SALONS.find((s) => s.id === id)!.priceFrom).toBeLessThanOrEqual(40_000);
    }
  });

  it("평점 기준과 적용 개수", () => {
    for (const id of pick({ minRating: 4.8 })) {
      expect(SALONS.find((s) => s.id === id)!.rating).toBeGreaterThanOrEqual(4.8);
    }
    expect(
      activeFilterCount({ amenities: ["cctv", "parking"], price: "under40", minRating: 4.8 })
    ).toBe(4);
  });

  it("편의시설 선택지는 실제로 있는 것만, 많은 순", () => {
    const options = amenityOptions(SALONS);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.count > 0)).toBe(true);
    expect(options.map((o) => o.count)).toEqual(
      [...options.map((o) => o.count)].sort((a, b) => b - a)
    );
  });
});
