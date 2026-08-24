"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import SalonCard from "@/components/ui/SalonCard";
import { SALONS } from "@/lib/data";

type Sort = "distance" | "rating" | "reviews";

const SORT_OPTIONS: [Sort, string][] = [
  ["distance", "가까운 순"],
  ["rating", "평점 높은 순"],
  ["reviews", "리뷰 많은 순"],
];

export default function SalonsPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("distance");
  const [todayOnly, setTodayOnly] = useState(false);

  const salons = useMemo(() => {
    const q = query.trim();
    let list = SALONS.filter(
      (s) =>
        (!todayOnly || s.availableToday) &&
        (q === "" ||
          s.name.includes(q) ||
          s.address.includes(q) ||
          s.tags.some((t) => t.includes(q)))
    );
    list = [...list].sort((a, b) => {
      if (sort === "distance") return a.distanceKm - b.distanceKm;
      if (sort === "rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });
    return list;
  }, [query, sort, todayOnly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        미용실 찾기
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        우리 동네의 검증된 반려동물 미용실이에요.
      </p>

      {/* 검색 */}
      <div className="relative mt-5">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="미용실 이름, 지역, 키워드로 검색"
          className="w-full rounded-2xl border border-cream-300 bg-white py-3.5 pl-12 pr-4 text-sm text-ink shadow-card outline-none transition-colors placeholder:text-ink-faint focus:border-mint-400"
          aria-label="미용실 검색"
        />
      </div>

      {/* 필터 */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-ink-faint" />
        {SORT_OPTIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSort(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors tap ${
              sort === key
                ? "bg-mint-500 text-white shadow-cta"
                : "border border-cream-300 bg-white text-ink-muted hover:border-mint-300"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTodayOnly((v) => !v)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors tap ${
            todayOnly
              ? "bg-coral-500 text-white"
              : "border border-cream-300 bg-white text-ink-muted hover:border-coral-300"
          }`}
          aria-pressed={todayOnly}
        >
          오늘 예약 가능
        </button>
      </div>

      {/* 목록 */}
      {salons.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji="🔍"
            title="조건에 맞는 미용실이 없어요"
            desc="검색어나 필터를 바꿔서 다시 찾아보세요."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salons.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>
      )}
    </div>
  );
}
