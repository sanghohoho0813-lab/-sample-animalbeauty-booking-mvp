"use client";

import { RotateCcw, Star } from "lucide-react";
import { useState } from "react";
import Sheet from "@/components/ui/Sheet";
import { SALONS } from "@/lib/data";
import { AMENITIES } from "@/lib/salon-info";
import {
  activeFilterCount,
  amenityOptions,
  EMPTY_FILTERS,
  PRICE_RANGES,
  RATING_CUTOFF,
  type SalonFilters,
} from "@/lib/salon-filters";
import type { Amenity } from "@/lib/types";

const OPTIONS = amenityOptions(SALONS);

/**
 * 미용실 상세 필터 — 고르는 동안 결과 수를 바로 보여주고, 확인을 눌러야 목록에 반영한다.
 * `countFor`는 지금의 검색어·'오늘 예약 가능'까지 반영한 결과 수를 돌려준다.
 */
export default function SalonFilterSheet({
  initial,
  countFor,
  onApply,
  onClose,
}: {
  initial: SalonFilters;
  countFor: (filters: SalonFilters) => number;
  onApply: (filters: SalonFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SalonFilters>(initial);
  const count = countFor(draft);
  const toggleAmenity = (key: Amenity) =>
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(key)
        ? d.amenities.filter((a) => a !== key)
        : [...d.amenities, key],
    }));

  return (
    <Sheet onClose={onClose} label="미용실 필터">
      <h2 className="text-lg font-bold text-ink">필터</h2>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold text-ink">
          가격 <span className="font-normal text-ink-muted">· 기본 미용 기준</span>
        </legend>
        <div
          className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="radiogroup"
          aria-label="가격"
        >
          {[{ key: "any" as const, label: "전체" }, ...PRICE_RANGES].map((r) => (
            <ChoiceChip
              key={r.key}
              on={draft.price === r.key}
              onClick={() => setDraft((d) => ({ ...d, price: r.key }))}
              role="radio"
            >
              {r.label}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-bold text-ink">평점</legend>
        <div className="mt-2.5 flex">
          <ChoiceChip
            on={draft.minRating !== null}
            onClick={() =>
              setDraft((d) => ({ ...d, minRating: d.minRating === null ? RATING_CUTOFF : null }))
            }
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {RATING_CUTOFF} 이상
          </ChoiceChip>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-bold text-ink">
          시설·편의 <span className="font-normal text-ink-muted">· 고른 것을 모두 갖춘 곳</span>
        </legend>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {OPTIONS.map(({ key }) => {
            const { label, icon: Icon } = AMENITIES[key];
            return (
              <ChoiceChip
                key={key}
                on={draft.amenities.includes(key)}
                onClick={() => toggleAmenity(key)}
                align="start"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </ChoiceChip>
            );
          })}
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-cream-200 bg-cream-50/95 px-5 pb-1 pt-4 backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => setDraft(EMPTY_FILTERS)}
          disabled={activeFilterCount(draft) === 0}
          className="flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-3.5 text-sm font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:bg-white disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          초기화
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          disabled={count === 0}
          className="flex-1 rounded-2xl bg-mint-500 py-3.5 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 disabled:bg-cream-300 disabled:text-ink-muted disabled:shadow-none tap"
        >
          {count === 0 ? "조건에 맞는 곳이 없어요" : `${count}곳 보기`}
        </button>
      </div>
    </Sheet>
  );
}

function ChoiceChip({
  on,
  onClick,
  children,
  role,
  align = "center",
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "radio";
  align?: "center" | "start";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...(role ? { role, "aria-checked": on } : { "aria-pressed": on })}
      className={`flex min-h-11 min-w-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors tap ${
        align === "start" ? "justify-start" : "justify-center"
      } ${
        on
          ? "bg-mint-50 text-mint-800 ring-2 ring-mint-500"
          : "bg-white text-ink-soft ring-1 ring-cream-300 hover:ring-mint-300"
      }`}
    >
      {children}
    </button>
  );
}
