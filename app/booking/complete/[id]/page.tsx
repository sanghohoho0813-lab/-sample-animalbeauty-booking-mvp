"use client";

import { CalendarDays, Home, ReceiptText } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import PetAvatar from "@/components/ui/PetAvatar";
import EmptyState from "@/components/ui/EmptyState";
import {
  getGroomerById,
  getSalonById,
  getServiceById,
} from "@/lib/data";
import { useDb } from "@/lib/db";
import { formatDateKo, formatWon } from "@/lib/format";

export default function BookingCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { bookings, pets, hydrated } = useDb();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
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
          emoji="🐾"
          title="예약 정보를 찾을 수 없어요"
          desc="이미 만료되었거나 잘못된 링크일 수 있어요."
          actionHref="/booking"
          actionLabel="새로 예약하기"
        />
      </div>
    );
  }

  const pet = pets.find((p) => p.id === booking.petId);
  const service = getServiceById(booking.serviceId);
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);

  return (
    <div className="bg-gradient-to-b from-mint-50 to-cream-50">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-10 md:pt-14">
        {/* 성공 애니메이션 */}
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
          <h1 className="mt-5 text-2xl font-extrabold text-ink animate-fade-in-up">
            예약이 완료되었습니다!
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            예약 내역은 마이페이지에서 언제든 확인할 수 있어요.
          </p>
        </div>

        {/* 예약 카드 */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card animate-fade-in-up">
          {pet && (
            <div className="flex items-center gap-3 border-b border-dashed border-cream-300 bg-cream-50 p-5">
              <PetAvatar pet={pet} size="md" />
              <div>
                <p className="text-base font-bold text-ink">{pet.name}</p>
                <p className="text-sm text-ink-muted">
                  {pet.breed} ({pet.age}살) · {pet.weight}kg
                </p>
              </div>
            </div>
          )}
          <dl className="space-y-3 p-5 text-sm">
            <Row label="서비스" value={service?.name ?? "-"} />
            <Row label="미용실" value={salon?.name ?? "-"} />
            <Row label="미용사" value={groomer?.name ?? "-"} />
            <Row
              label="예약 일시"
              value={`${formatDateKo(booking.date)} ${booking.time}`}
            />
            {booking.discount > 0 && (
              <Row
                label="할인"
                value={`- ₩ ${booking.discount.toLocaleString("ko-KR")}`}
                accent
              />
            )}
            <div className="flex items-center justify-between border-t border-cream-200 pt-3">
              <dt className="font-bold text-ink">결제 금액</dt>
              <dd className="text-lg font-extrabold text-coral-500">
                {formatWon(booking.total)}
              </dd>
            </div>
          </dl>
          <div className="bg-mint-50 px-5 py-3.5 text-center text-xs font-semibold text-mint-700">
            예약번호 {booking.bookingNo}
          </div>
        </div>

        {/* 액션 */}
        <div className="mt-6 space-y-3">
          <Link
            href="/bookings"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 px-6 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
          >
            <ReceiptText className="h-5 w-5" />
            예약 내역 보기
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-300 bg-white px-6 py-4 text-base font-bold text-ink-soft transition-colors hover:bg-cream-100 tap"
          >
            <Home className="h-5 w-5" />
            홈으로 이동
          </Link>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
          <CalendarDays className="h-3.5 w-3.5" />
          방문 하루 전에 알림으로 다시 알려드릴게요.
        </p>

        <div className="mt-6 text-center text-5xl" aria-hidden>
          🛁🐶🫧
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={`text-right font-semibold ${accent ? "text-coral-500" : "text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}
