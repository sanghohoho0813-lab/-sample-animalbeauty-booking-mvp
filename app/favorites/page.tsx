"use client";

import { Heart } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import SalonCard from "@/components/ui/SalonCard";
import { SALONS } from "@/lib/data";
import { useDb } from "@/lib/db";

export default function FavoritesPage() {
  const { favorites, hydrated } = useDb();
  const liked = SALONS.filter((s) => favorites.includes(s.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">찜한 미용실</h1>
      {hydrated && liked.length > 0 && (
        <p className="mt-0.5 text-sm text-ink-muted">{liked.length}곳을 찜했어요</p>
      )}
      <div className="mt-5">
        {!hydrated ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-[8.875rem] rounded-3xl sm:h-[27.25rem]" />
            ))}
          </div>
        ) : liked.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="아직 찜한 미용실이 없어요"
            desc="미용실 카드의 하트를 눌러 찜해보세요."
            actionHref="/salons"
            actionLabel="미용실 둘러보기"
          />
        ) : (
          <div className="grid grid-cols-1 divide-y divide-cream-200 sm:grid-cols-2 sm:gap-4 sm:divide-y-0 lg:grid-cols-3">
            {liked.map((salon) => (
              <SalonCard key={salon.id} salon={salon} compactOnMobile />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
