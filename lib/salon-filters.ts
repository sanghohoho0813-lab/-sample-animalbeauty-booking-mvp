import type { Amenity, Salon } from "./types";

/** 미용실 찾기의 상세 필터 (검색어·'오늘 예약 가능'·정렬은 화면에서 따로 다룬다) */
export interface SalonFilters {
  /** 모두 갖춘 매장만 */
  amenities: Amenity[];
  price: PriceRange;
  /** 이 평점 이상 */
  minRating: number | null;
}

export type PriceRange = "any" | "under40" | "40to50" | "over50";

export const EMPTY_FILTERS: SalonFilters = { amenities: [], price: "any", minRating: null };

/** 기본 미용 가격 구간 */
export const PRICE_RANGES: { key: Exclude<PriceRange, "any">; label: string }[] = [
  { key: "under40", label: "4만 원 이하" },
  { key: "40to50", label: "4만~5만 원" },
  { key: "over50", label: "5만 원 초과" },
];

export const RATING_CUTOFF = 4.8;

function inRange(price: number, range: PriceRange): boolean {
  if (range === "under40") return price <= 40_000;
  if (range === "40to50") return price > 40_000 && price <= 50_000;
  if (range === "over50") return price > 50_000;
  return true;
}

export function matchesFilters(salon: Salon, f: SalonFilters): boolean {
  return (
    f.amenities.every((a) => salon.amenities.includes(a)) &&
    inRange(salon.priceFrom, f.price) &&
    (f.minRating === null || salon.rating >= f.minRating)
  );
}

/** 적용 중인 필터 개수 — 필터 버튼의 숫자 */
export function activeFilterCount(f: SalonFilters): number {
  return f.amenities.length + (f.price === "any" ? 0 : 1) + (f.minRating === null ? 0 : 1);
}

/** 필터에 보여줄 편의시설 — 실제로 갖춘 매장이 있는 것만, 많은 순 */
export function amenityOptions(salons: Salon[]): { key: Amenity; count: number }[] {
  const counts = new Map<Amenity, number>();
  for (const s of salons) for (const a of s.amenities) counts.set(a, (counts.get(a) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
