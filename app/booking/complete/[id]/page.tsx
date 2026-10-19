"use client";

import { SearchX } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import BookingDetail from "@/components/bookings/BookingDetail";
import EmptyState from "@/components/ui/EmptyState";
import { getSalonById } from "@/lib/data";
import { useDb } from "@/lib/db";
import { formatDateShortKo } from "@/lib/format";

/**
 * 예약 직후 화면 — 성공을 분명히 알리고, 바로 이어서 방문 전 안내·일정 관리로 이어지게 한다.
 * 이미 취소됐거나 끝난 예약을 이 주소로 열면 성공 표시 없이 예약 상세만 보여준다.
 */
export default function BookingCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { bookings, hydrated } = useDb();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="skeleton mx-auto h-20 w-20 rounded-full" />
        <div className="skeleton mt-6 h-64 rounded-3xl" />
      </div>
    );
  }

  const booking = bookings.find((b) => b.id === id) ?? null;
  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <EmptyState
          icon={SearchX}
          title="예약 정보를 찾을 수 없어요"
          desc="이미 만료되었거나 잘못된 링크일 수 있어요."
          actionHref="/booking"
          actionLabel="새로 예약하기"
          titleAs="h1"
        />
      </div>
    );
  }

  const isActive = booking.status === "confirmed" || booking.status === "pending";
  if (!isActive) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10 lg:max-w-5xl">
        <BookingDetail booking={booking} />
      </div>
    );
  }

  const salon = getSalonById(booking.salonId);

  return (
    <div className="bg-gradient-to-b from-mint-50 to-cream-50">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-10 md:px-6 md:pt-14">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-mint-500 shadow-cta animate-pop-check">
            <svg
              viewBox="0 0 40 40"
              className="h-10 w-10"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M10 21 L17 28 L30 13" className="check-draw" />
            </svg>
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink animate-fade-in-up">
            예약이 확정되었어요
          </h1>
          <p className="mt-2 text-base text-ink-soft">
            {formatDateShortKo(booking.date)} {booking.time} · {salon?.name}
          </p>
          <div className="mt-6 flex w-full gap-2.5 sm:w-auto">
            <Link
              href={`/bookings/${booking.id}`}
              className="flex flex-1 items-center justify-center rounded-2xl bg-mint-500 px-6 py-3.5 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap sm:flex-none"
            >
              예약 내역 보기
            </Link>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:bg-cream-100 tap sm:flex-none"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-16 md:px-6 lg:max-w-5xl">
        <BookingDetail booking={booking} embedded />
      </div>
    </div>
  );
}
