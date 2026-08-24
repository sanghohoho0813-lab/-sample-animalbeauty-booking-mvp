"use client";

import EmptyState from "@/components/ui/EmptyState";
import SalonCard from "@/components/ui/SalonCard";
import { SALONS } from "@/lib/data";
import { useDb } from "@/lib/db";

export default function FavoritesPage() {
  const { favorites, hydrated } = useDb();
  const liked = SALONS.filter((s) => favorites.includes(s.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        찜한 미용실
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        마음에 든 미용실을 모아두고 빠르게 예약하세요.
      </p>

      <div className="mt-6">
        {!hydrated ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-72 rounded-3xl" />
            ))}
          </div>
        ) : liked.length === 0 ? (
          <EmptyState
            emoji="💚"
            title="아직 찜한 미용실이 없어요"
            desc="미용실 카드의 하트를 눌러 찜해보세요."
            actionHref="/salons"
            actionLabel="미용실 둘러보기"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liked.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
