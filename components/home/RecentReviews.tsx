"use client";

import { StarRow } from "@/components/ui/Stars";
import { REVIEWS, SALONS } from "@/lib/data";
import { useDb } from "@/lib/db";
import type { Review } from "@/lib/types";

/**
 * 홈 '최근 후기' — 샘플 후기와 사용자가 방금 남긴 후기를 날짜순으로 합쳐 보여준다.
 * 서버 렌더 시점에는 샘플 후기만 그리고, 저장소를 읽은 뒤 사용자 후기를 더한다.
 */
export default function RecentReviews({ limit = 3 }: { limit?: number }) {
  const { reviews } = useDb();
  const recent: Review[] = [...reviews, ...REVIEWS]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);

  return (
    <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
      {recent.map((review) => {
        const salon = SALONS.find((s) => s.id === review.salonId);
        return (
          <div
            key={review.id}
            className="flex w-[82%] shrink-0 snap-start flex-col rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:w-[60%] md:w-auto"
          >
            <div className="flex items-center justify-between">
              <StarRow rating={review.rating} />
              <span className="text-xs text-ink-faint">{review.date}</span>
            </div>
            <p className="mt-3 line-clamp-4 break-words text-sm leading-relaxed text-ink-soft">
              {review.content}
            </p>
            <div className="mt-auto pt-4">
              <p className="text-xs font-semibold text-ink-muted">
                {review.author} · {review.petName} 보호자
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {salon?.name} · {review.serviceName}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
