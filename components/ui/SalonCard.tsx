"use client";

import { Heart, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toggleFavorite, useDb } from "@/lib/db";
import { formatWon } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Salon } from "@/lib/types";
import { RatingBadge } from "./Stars";

export default function SalonCard({ salon }: { salon: Salon }) {
  const { favorites, hydrated } = useDb();
  const { toast } = useToast();
  const liked = hydrated && favorites.includes(salon.id);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link
        href={`/booking?salon=${salon.id}`}
        className="block"
        aria-label={`${salon.name} 예약하기`}
      >
        <div
          className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${salon.gradient}`}
        >
          <Image
            src={salon.image}
            alt={`${salon.name} 미용실`}
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {salon.availableToday && (
            <span className="absolute left-3 top-3 rounded-full bg-mint-600/90 px-2.5 py-1 text-[11px] font-bold text-white">
              오늘 예약 가능
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-bold text-ink">{salon.name}</p>
            <RatingBadge rating={salon.rating} reviewCount={salon.reviewCount} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
            <MapPin className="h-3.5 w-3.5" />
            {salon.distanceKm}km · {salon.address.split(" ").slice(1, 3).join(" ")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {salon.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-semibold text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            <span className="font-extrabold text-ink">
              {formatWon(salon.priceFrom)}
            </span>
            <span className="ml-1">부터</span>
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => {
          toggleFavorite(salon.id);
          toast(
            liked ? "찜 목록에서 삭제했어요" : "찜 목록에 추가했어요",
            "info"
          );
        }}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition-transform tap"
        aria-label={liked ? "찜 해제" : "찜하기"}
        aria-pressed={liked}
      >
        <Heart
          className={`h-5 w-5 transition-colors ${
            liked ? "fill-coral-500 text-coral-500" : "text-ink-faint"
          }`}
        />
      </button>
    </div>
  );
}
