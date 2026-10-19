"use client";

import { StarRow } from "@/components/ui/Stars";
import { getSeedReviews, SALONS } from "@/lib/data";
import { useDb } from "@/lib/db";
import { maskName, relativeDay } from "@/lib/reviews";
import { useNow } from "@/lib/use-now";

/**
 * 홈 '최근 후기' — 공개 후기와 내가 방금 남긴 후기를 최신순으로.
 * 날짜를 오늘 기준으로 계산하므로 마운트 후에 그린다.
 */
export default function RecentReviews({ limit = 3 }: { limit?: number }) {
  const { reviews } = useDb();
  const now = useNow();
  const recent = now
    ? [...reviews, ...getSeedReviews(now)]
        .filter((r) => r.content)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit)
    : [];

  return (
    // 모바일에서는 가로로 넘기는 영역 — 키보드로도 스크롤할 수 있게 포커스를 받는다
    <ul
      tabIndex={0}
      aria-label="최근 보호자 후기 목록"
      className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0"
    >
      {!now &&
        Array.from({ length: limit }, (_, i) => (
          <li
            key={i}
            className="skeleton h-[12.5rem] w-[82%] shrink-0 rounded-3xl md:w-auto"
            aria-hidden
          />
        ))}
      {recent.map((review) => {
        const salon = SALONS.find((s) => s.id === review.salonId);
        return (
          <li
            key={review.id}
            className="flex w-[82%] shrink-0 snap-start flex-col rounded-3xl bg-white p-5 ring-1 ring-cream-200 md:w-auto"
          >
            <div className="flex items-center justify-between gap-2">
              <StarRow rating={review.rating} />
              <span className="text-sm text-ink-faint">{relativeDay(review.date, now!)}</span>
            </div>
            <p className="mb-4 mt-3 line-clamp-3 break-words text-base leading-relaxed text-ink">
              {review.content}
            </p>
            <div className="mt-auto flex items-center gap-2.5 border-t border-cream-200 pt-3.5 text-sm">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-100 text-xs font-bold text-ink-soft"
                aria-hidden
              >
                {review.author.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink-soft">
                  {maskName(review.author)} · {review.petName}
                </span>
                <span className="block truncate text-ink-muted">
                  {salon?.name} · {review.serviceName}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
