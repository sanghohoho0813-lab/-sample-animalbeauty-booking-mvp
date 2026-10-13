"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import BookingDetail from "@/components/bookings/BookingDetail";
import EmptyState from "@/components/ui/EmptyState";
import { useDb } from "@/lib/db";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { bookings, hydrated } = useDb();
  const booking = bookings.find((b) => b.id === id) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-10">
      <Link
        href="/bookings"
        className="-ml-2 mb-3 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-cream-100 hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        예약 내역
      </Link>
      {!hydrated ? (
        <div className="skeleton h-[28rem] rounded-3xl" aria-hidden />
      ) : booking ? (
        <BookingDetail booking={booking} />
      ) : (
        <EmptyState
          emoji="🐾"
          title="예약 정보를 찾을 수 없어요"
          desc="이미 정리되었거나 잘못된 링크일 수 있어요."
          actionHref="/bookings"
          actionLabel="예약 내역으로"
          titleAs="h1"
        />
      )}
    </div>
  );
}
