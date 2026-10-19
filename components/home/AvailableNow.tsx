"use client";

import { Clock3, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { areaOf } from "@/components/ui/SalonRow";
import { SALONS } from "@/lib/data";
import { countReviews, useDb } from "@/lib/db";
import { formatWon } from "@/lib/format";
import { slotLabel } from "@/lib/salon-info";
import { earliestSlotAtSalon } from "@/lib/slots";
import { useNow } from "@/lib/use-now";

/**
 * '지금 바로 예약할 수 있는 곳' — 가장 빠른 빈 시간 순으로 (실제 예약 데이터 기준).
 * 홈에서 '어디가 비어 있지?'를 매장마다 들어가 보지 않고 한 번에 판단하게 한다.
 */
export default function AvailableNow() {
  const { bookings, reviews, hydrated } = useDb();
  const now = useNow();

  const items =
    now && hydrated
      ? SALONS.map((salon) => ({ salon, slot: earliestSlotAtSalon(salon.id, bookings, now) }))
          .filter((x) => x.slot)
          .sort(
            (a, b) =>
              `${a.slot!.date}${a.slot!.time}`.localeCompare(`${b.slot!.date}${b.slot!.time}`) ||
              a.salon.distanceKm - b.salon.distanceKm
          )
      : null;

  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
      {!items &&
        [0, 1].map((i) => (
          <li
            key={i}
            className="skeleton h-[16.5rem] w-[78%] shrink-0 rounded-3xl md:w-auto"
            aria-hidden
          />
        ))}
      {items?.map(({ salon, slot }) => {
        const label = slotLabel(slot!, now!);
        const today = label.startsWith("오늘");
        return (
          <li key={salon.id} className="w-[78%] shrink-0 snap-start md:w-auto">
            <Link href={`/salons/${salon.id}`} className="group block">
              <span
                className={`relative block aspect-[16/10] overflow-hidden rounded-3xl bg-gradient-to-br ${salon.gradient}`}
              >
                <Image
                  src={salon.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 22rem, (min-width: 768px) 30vw, 78vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span
                  className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                    today ? "bg-mint-500 text-white" : "bg-white/95 text-ink"
                  }`}
                >
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {label} 가능
                </span>
                {salon.species === "cat" && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-coral-700">
                    고양이 전용
                  </span>
                )}
              </span>
              <span className="mt-2.5 flex items-center justify-between gap-2">
                <span className="truncate text-base font-bold text-ink">{salon.name}</span>
                <span className="flex shrink-0 items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="font-semibold text-ink">{salon.rating.toFixed(1)}</span>
                  <span className="text-ink-muted">
                    (
                    {(
                      salon.reviewCount + countReviews(reviews, "salonId", salon.id)
                    ).toLocaleString("ko-KR")}
                    )
                  </span>
                </span>
              </span>
              <span className="block truncate text-sm text-ink-muted">{salon.headline}</span>
              <span className="block truncate text-sm text-ink-muted">
                {salon.distanceKm}km · {areaOf(salon.address)} · 기본 미용{" "}
                <span className="font-semibold text-ink-soft">{formatWon(salon.priceFrom)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
