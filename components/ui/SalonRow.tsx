import { Star } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { formatWon } from "@/lib/format";
import type { Salon } from "@/lib/types";

/** 주소에서 동네 이름 (서울 강남구 청담동 12-3 → 청담동) */
export const areaOf = (address: string) => address.split(" ")[2] ?? address;

/**
 * 미용실 한 줄 요약 — 예약을 정할 때 보는 순서(평점·거리 → 예약 가능 시간 → 가격)로 보여준다.
 * 감싸는 요소(선택 버튼/링크)는 사용하는 쪽에서 정한다.
 */
export default function SalonRow({
  salon,
  reviewCount,
  price,
  availability,
  badge,
}: {
  salon: Salon;
  reviewCount: number;
  /** 표시할 가격 — 기본은 그 미용실의 기본 미용 가격 */
  price?: { label: string; amount: number; note?: string };
  /** 가장 빠른 예약 가능 시간 */
  availability?: ReactNode;
  /** 사진 위 작은 표시 (지난번 방문·고양이 전용 등) */
  badge?: ReactNode;
}) {
  const shown = price ?? { label: "기본 미용", amount: salon.priceFrom };
  return (
    <div className="flex min-w-0 items-center gap-3.5">
      <div
        className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${salon.gradient}`}
      >
        <Image src={salon.image} alt="" fill sizes="96px" className="object-cover" />
        {badge && <span className="absolute inset-x-1 bottom-1 flex justify-center">{badge}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-ink">{salon.name}</p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-ink-muted">
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
          {reviewCount > 0 ? (
            <>
              <span className="font-semibold text-ink">{salon.rating.toFixed(1)}</span>
              <span>({reviewCount.toLocaleString("ko-KR")})</span>
            </>
          ) : (
            <span>신규 매장</span>
          )}
          <span aria-hidden>·</span>
          <span className="truncate">
            {salon.distanceKm}km · {areaOf(salon.address)}
          </span>
        </p>
        {availability && <p className="mt-1 truncate text-sm">{availability}</p>}
        <p className="mt-0.5 truncate text-sm text-ink-muted">
          <span className="mr-1">{shown.label}</span>
          <span className="font-bold text-ink">{formatWon(shown.amount)}</span>
          {shown.note && <span className="ml-1">{shown.note}</span>}
        </p>
      </div>
    </div>
  );
}
