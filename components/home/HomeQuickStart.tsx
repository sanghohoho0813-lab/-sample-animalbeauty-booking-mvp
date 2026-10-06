"use client";

import { CalendarCheck, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import PetAvatar from "@/components/ui/PetAvatar";
import { getSalonById, getServiceById } from "@/lib/data";
import { useDb } from "@/lib/db";
import { dDayLabel, formatDateShortKo } from "@/lib/format";
import type { Booking } from "@/lib/types";

/**
 * 홈 상단 개인화 영역 — 다가오는 예약 + 우리 아이 바로 예약.
 * 저장소를 읽은 뒤에만 그리므로(서버 렌더 시 자리만 잡음) 날짜 계산이 hydration과 어긋나지 않는다.
 */
export default function HomeQuickStart() {
  const { hydrated, pets, bookings } = useDb();

  if (!hydrated) {
    return <div className="skeleton h-[7.5rem] rounded-3xl" aria-hidden />;
  }

  const next: Booking | undefined = bookings
    .filter((b) => b.status === "confirmed" || b.status === "pending")
    .sort((a, b) => (`${a.date}${a.time}` < `${b.date}${b.time}` ? -1 : 1))[0];

  return (
    <div className={`grid grid-cols-1 gap-3 ${next ? "lg:grid-cols-2" : ""}`}>
      {next && <UpcomingCard booking={next} pet={pets.find((p) => p.id === next.petId)} />}

      <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-card md:p-5">
        <p className="text-base font-bold text-ink">누구의 미용을 예약할까요?</p>
        <ul className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link
                href={`/booking?pet=${pet.id}&step=1`}
                className="flex w-[4.5rem] flex-col items-center gap-1.5 rounded-2xl py-1.5 transition-colors hover:bg-mint-50 tap"
                aria-label={`${pet.name} 미용 예약하기`}
              >
                <PetAvatar pet={pet} size="md" className="ring-2 ring-mint-100" />
                <span className="w-full truncate text-center text-sm font-semibold text-ink">
                  {pet.name}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/pets?add=1"
              className="flex w-[4.5rem] flex-col items-center gap-1.5 rounded-2xl py-1.5 transition-colors hover:bg-mint-50 tap"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-cream-300 text-ink-faint">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-ink-muted">추가</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

function UpcomingCard({
  booking,
  pet,
}: {
  booking: Booking;
  pet?: Parameters<typeof PetAvatar>[0]["pet"];
}) {
  const service = getServiceById(booking.serviceId);
  const salon = getSalonById(booking.salonId);
  const dDay = dDayLabel(booking.date);
  return (
    <Link
      href="/bookings"
      className="group flex items-center gap-4 rounded-3xl border border-mint-200 bg-mint-50/70 p-4 shadow-card transition-colors hover:bg-mint-50 md:p-5"
    >
      {pet ? (
        <PetAvatar pet={pet} size="md" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-mint-600">
          <CalendarCheck className="h-7 w-7" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-bold text-mint-700">
          다가오는 예약
          {dDay && (
            <span className="rounded-full bg-mint-500 px-2 py-0.5 text-xs font-bold text-white">
              {dDay}
            </span>
          )}
        </p>
        <p className="mt-1 truncate text-base font-bold text-ink">
          {pet?.name ?? "반려동물"} · {service?.name}
        </p>
        <p className="truncate text-sm text-ink-muted">
          {formatDateShortKo(booking.date)} {booking.time} · {salon?.name}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-mint-600 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
