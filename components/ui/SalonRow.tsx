import { Star } from "lucide-react";
import Image from "next/image";
import { formatWon } from "@/lib/format";
import type { Salon } from "@/lib/types";

/**
 * 모바일용 미용실 한 줄 요약 — 썸네일 + 이름·평점·거리·특징·가격.
 * 큰 사진 카드는 한 화면에 1개 남짓만 보이므로, 비교가 필요한 목록에서는 이 형태를 쓴다.
 * 감싸는 요소(선택 버튼/링크)는 사용하는 쪽에서 정한다.
 */
export default function SalonRow({
  salon,
  reviewCount,
  price,
}: {
  salon: Salon;
  reviewCount: number;
  /** 표시할 가격 — 기본은 그 미용실의 기본 미용 가격 */
  price?: { label: string; amount: number };
}) {
  const shown = price ?? { label: "기본 미용", amount: salon.priceFrom };
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      <div
        className={`relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${salon.gradient}`}
      >
        <Image
          src={salon.image}
          alt={`${salon.name} 미용실`}
          fill
          sizes="88px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-ink">{salon.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-ink">{salon.rating.toFixed(1)}</span>
          <span className="text-ink-faint">({reviewCount})</span>
          <span className="text-ink-faint">·</span>
          {salon.distanceKm}km
        </p>
        <p className="mt-0.5 truncate text-sm text-ink-muted">
          {salon.availableToday && (
            <span className="font-semibold text-mint-600">오늘 가능 · </span>
          )}
          {salon.tags.slice(0, 2).join(" · ")}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          <span className="mr-1">{shown.label}</span>
          <span className="font-extrabold text-ink">{formatWon(shown.amount)}</span>
        </p>
      </div>
    </div>
  );
}
