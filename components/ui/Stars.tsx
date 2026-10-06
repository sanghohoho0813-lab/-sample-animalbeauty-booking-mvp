import { Star } from "lucide-react";

export function RatingBadge({
  rating,
  reviewCount,
  className = "",
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center gap-1 text-sm font-semibold text-ink ${className}`}
    >
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
      <span className="sr-only">평점</span>
      {rating.toFixed(1)}
      {typeof reviewCount === "number" && (
        <span className="font-medium text-ink-faint">
          ({reviewCount.toLocaleString("ko-KR")}
          <span className="sr-only">개 후기</span>)
        </span>
      )}
    </span>
  );
}

export function StarRow({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`별점 5점 중 ${rating}점`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n <= rating ? "fill-amber-400 text-amber-400" : "fill-cream-200 text-cream-200"
          }`}
        />
      ))}
    </span>
  );
}
