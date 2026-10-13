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
    <ul className="mt-4 grid grid-cols-1 divide-y divide-cream-200 rounded-3xl bg-white px-5 ring-1 ring-cream-200 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-0">
      {!now &&
        Array.from({ length: limit }, (_, i) => (
          <li key={i} className="py-5 md:px-6" aria-hidden>
            <div className="skeleton h-24 rounded-2xl" />
          </li>
        ))}
      {recent.map((review) => {
        const salon = SALONS.find((s) => s.id === review.salonId);
        return (
          <li key={review.id} className="flex flex-col py-5 md:px-6">
            <div className="flex items-center justify-between gap-2">
              <StarRow rating={review.rating} />
              <span className="text-sm text-ink-muted">{relativeDay(review.date, now!)}</span>
            </div>
            <p className="mt-2.5 line-clamp-3 break-words text-base leading-relaxed text-ink-soft">
              {review.content}
            </p>
            <p className="mt-auto pt-3 text-sm text-ink-muted">
              <span className="font-semibold text-ink-soft">{maskName(review.author)}</span> ·{" "}
              {review.petName} · {salon?.name} {review.serviceName}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
