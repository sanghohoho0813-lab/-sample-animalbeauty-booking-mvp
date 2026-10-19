"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SalonAvailability from "@/components/salon/SalonAvailability";
import { countReviews, toggleFavorite, useDb } from "@/lib/db";
import { formatWon } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Salon } from "@/lib/types";
import SalonRow, { areaOf } from "./SalonRow";

/**
 * 미용실 카드 — 누르면 매장 상세(가격·후기·미용사·예약 가능 시간)로 간다.
 * `compactOnMobile`이면 모바일에서는 한 줄 요약으로 바뀌어 한 화면에서 여러 곳을 비교할 수 있다.
 */
export default function SalonCard({
  salon,
  compactOnMobile = false,
}: {
  salon: Salon;
  compactOnMobile?: boolean;
}) {
  const { favorites, reviews, hydrated } = useDb();
  const { toast } = useToast();
  const liked = hydrated && favorites.includes(salon.id);
  const reviewCount = salon.reviewCount + countReviews(reviews, "salonId", salon.id);
  const href = `/salons/${salon.id}`;

  const heart = (className: string) => (
    <button
      type="button"
      onClick={() => {
        toggleFavorite(salon.id);
        toast(liked ? "찜 목록에서 삭제했어요" : "찜 목록에 추가했어요", "info");
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform tap ${className}`}
      aria-label={liked ? `${salon.name} 찜 해제` : `${salon.name} 찜하기`}
      aria-pressed={liked}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked ? "fill-coral-500 text-coral-500" : "text-ink-faint"
        }`}
      />
    </button>
  );

  return (
    <>
      {compactOnMobile && (
        <div className="relative py-3.5 pr-10 sm:hidden">
          <Link href={href} className="block" aria-label={`${salon.name} 자세히 보기`}>
            <SalonRow
              salon={salon}
              reviewCount={reviewCount}
              availability={<SalonAvailability salonId={salon.id} />}
            />
          </Link>
          {heart("absolute -right-1.5 top-1.5")}
        </div>
      )}
      <div
        className={`group relative overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${
          compactOnMobile ? "hidden sm:block" : ""
        }`}
      >
        <Link href={href} className="block" aria-label={`${salon.name} 자세히 보기`}>
          <div
            className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${salon.gradient}`}
          >
            <Image
              src={salon.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            {salon.species === "cat" && (
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-coral-700">
                고양이 전용
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-base font-bold text-ink">{salon.name}</p>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {salon.rating.toFixed(1)}
                <span className="font-medium text-ink-muted">
                  ({reviewCount.toLocaleString("ko-KR")})
                </span>
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-ink-muted">
              {salon.distanceKm}km · {areaOf(salon.address)} · {salon.headline}
            </p>
            <div className="mt-3 flex items-end justify-between gap-2 border-t border-cream-200 pt-3 text-sm">
              <SalonAvailability salonId={salon.id} />
              <span className="shrink-0 text-ink-muted">
                기본 <span className="font-bold text-ink">{formatWon(salon.priceFrom)}</span>
              </span>
            </div>
          </div>
        </Link>
        {heart("absolute right-3 top-3 bg-white/90 shadow-card backdrop-blur")}
      </div>
    </>
  );
}
