"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import SalonCard from "@/components/ui/SalonCard";
import { SALONS } from "@/lib/data";
import { useDb } from "@/lib/db";
import { toDateKey } from "@/lib/format";
import { earliestSlotAtSalon } from "@/lib/slots";
import { useNow } from "@/lib/use-now";

type Sort = "distance" | "soonest" | "rating" | "reviews";

const SORT_OPTIONS: [Sort, string][] = [
  ["distance", "가까운 순"],
  ["soonest", "빨리 예약 가능한 순"],
  ["rating", "평점 높은 순"],
  ["reviews", "후기 많은 순"],
];

export default function SalonsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("distance");
  const [todayOnly, setTodayOnly] = useState(false);
  const { bookings, hydrated } = useDb();
  const now = useNow();

  // 매장별 가장 빠른 예약 가능 시각 (실제 예약 데이터 기준 · 마운트 후 계산)
  const earliest = useMemo(() => {
    if (!now || !hydrated) return null;
    return new Map(SALONS.map((s) => [s.id, earliestSlotAtSalon(s.id, bookings, now)]));
  }, [now, hydrated, bookings]);
  const todayKey = now ? toDateKey(now) : "";

  const salons = useMemo(() => {
    const slotKey = (id: string) => {
      const slot = earliest?.get(id);
      return slot ? `${slot.date} ${slot.time}` : "9999";
    };
    const q = query.trim();
    let list = SALONS.filter(
      (s) =>
        (!todayOnly || earliest?.get(s.id)?.date === todayKey) &&
        (q === "" ||
          s.name.includes(q) ||
          s.address.includes(q) ||
          s.headline.includes(q) ||
          s.breeds.some((b) => b.includes(q)) ||
          s.tags.some((t) => t.includes(q)))
    );
    list = [...list].sort((a, b) => {
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "soonest")
        return slotKey(a.id).localeCompare(slotKey(b.id)) || a.distanceKm - b.distanceKm;
      if (sort === "rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });
    return list;
  }, [query, sort, todayOnly, earliest, todayKey]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-6 md:px-6 md:pb-10 md:pt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">미용실 찾기</h1>
          <p className="mt-0.5 text-sm text-ink-muted">내 주변 반려동물 미용실</p>
        </div>
      </div>

      {/* 검색·필터 — 스크롤해도 위에 붙어 있다 */}
      <div className="sticky top-14 z-30 -mx-4 mt-4 bg-cream-50/95 px-4 pb-2 pt-2 backdrop-blur-xl md:top-16 md:mx-0 md:px-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="매장 이름, 동네, 견종으로 검색"
            className="w-full rounded-full border border-cream-300 bg-white py-3 pl-12 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-mint-500 focus:ring-4 focus:ring-mint-100"
            aria-label="미용실 검색"
          />
        </div>

        <div className="-mx-4 mt-2.5 flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0">
          {/* 거르기 */}
          <label
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
              todayOnly
                ? "border-mint-500 bg-mint-50 text-mint-800"
                : "border-cream-300 bg-white text-ink-soft hover:border-ink-faint"
            }`}
          >
            <input
              type="checkbox"
              checked={todayOnly}
              onChange={(e) => setTodayOnly(e.target.checked)}
              className="h-4 w-4 accent-mint-500"
            />
            오늘 예약 가능
          </label>
          <span className="h-5 w-px shrink-0 bg-cream-300" aria-hidden />
          {/* 정렬 */}
          {SORT_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors tap ${
                sort === key
                  ? "bg-ink text-white"
                  : "border border-cream-300 bg-white text-ink-muted hover:border-ink-faint"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 수 */}
      <p className="mt-2 text-sm text-ink-muted" aria-live="polite">
        <span className="font-bold text-ink">{salons.length}곳</span>
        {query.trim() && ` · '${query.trim()}' 검색 결과`}
        {todayOnly && " · 오늘 예약 가능한 곳만"}
      </p>

      {/* 목록 */}
      {salons.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={SearchX}
            title="조건에 맞는 미용실이 없어요"
            desc="검색어나 필터를 바꿔서 다시 찾아보세요."
          >
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTodayOnly(false);
              }}
              className="mt-5 rounded-full bg-mint-500 px-6 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
            >
              검색 조건 초기화
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-1 divide-y divide-cream-200 sm:mt-4 sm:grid-cols-2 sm:gap-5 sm:divide-y-0 lg:grid-cols-3">
          {salons.map((salon) => (
            <SalonCard key={salon.id} salon={salon} compactOnMobile />
          ))}
        </div>
      )}
    </div>
  );
}
