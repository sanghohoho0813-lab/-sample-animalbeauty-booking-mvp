"use client";

import { CalendarCheck, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { STAGE_LABEL, STAGE_STYLE } from "@/components/bookings/BookingDetail";
import PetAvatar from "@/components/ui/PetAvatar";
import { DEMO_USER, getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { useDb } from "@/lib/db";
import { formatDateShortKo } from "@/lib/format";
import { josa } from "@/lib/josa";
import { bookingStage, daysUntil, isActive, nextGroomingDate, petHistory } from "@/lib/lifecycle";
import type { Booking, Pet } from "@/lib/types";
import { useNow } from "@/lib/use-now";

/** 아이별 지금 상태 — 예약이 있는지, 미용할 때가 됐는지 */
function petStatus(pet: Pet, bookings: Booking[], now: Date) {
  const { last, upcoming } = petHistory(pet.id, bookings);
  if (upcoming) {
    return {
      tone: "mint" as const,
      text: `${formatDateShortKo(upcoming.date)} 예약 있음`,
      due: false,
    };
  }
  if (!last) return { tone: "muted" as const, text: "아직 미용 기록이 없어요", due: false };
  const next = nextGroomingDate(last);
  const left = daysUntil(next, now);
  if (left < 0) {
    return { tone: "coral" as const, text: `미용 시기가 ${-left}일 지났어요`, due: true };
  }
  if (left <= 7) {
    return {
      tone: "coral" as const,
      text: `${left === 0 ? "오늘" : `${left}일 뒤`}가 미용 추천일이에요`,
      due: true,
    };
  }
  return { tone: "muted" as const, text: `다음 미용 추천 ${formatDateShortKo(next)}`, due: false };
}

/**
 * 홈 상단 — 로그인한 보호자가 매번 가장 먼저 확인할 것:
 * 다가오는 예약, 그리고 아이별로 '예약이 있는지 / 미용할 때가 됐는지'.
 * 날짜 계산이 필요해 마운트 후에 그리고, 그 전에는 같은 크기의 자리만 잡는다.
 */
export default function HomeDashboard() {
  const { hydrated, pets, bookings } = useDb();
  const now = useNow();

  if (!hydrated || !now) {
    return (
      <div>
        <h1 className="sr-only">PawBeauty 홈</h1>
        <div className="skeleton h-5 w-40 rounded-full" aria-hidden />
        <div className="skeleton mt-2 h-8 w-64 rounded-full" aria-hidden />
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2" aria-hidden>
          <div className="skeleton h-[11.5rem] rounded-3xl" />
          <div className="skeleton h-[14rem] rounded-3xl" />
        </div>
      </div>
    );
  }

  const upcoming = bookings
    .filter(isActive)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const next = upcoming[0];
  const statuses = pets.map((pet) => ({ pet, ...petStatus(pet, bookings, now) }));
  const duePet = statuses.find((s) => s.due)?.pet;

  // 오늘의 한 줄 — 가장 먼저 챙길 일을 제목으로
  let headline = "우리 아이 미용, 1분이면 예약해요";
  if (next) {
    const nextPet = pets.find((p) => p.id === next.petId)?.name ?? "우리 아이";
    const stage = bookingStage(next, now);
    headline =
      stage === "today"
        ? `오늘 ${next.time}, ${nextPet} 미용이 있어요`
        : stage === "tomorrow"
          ? `내일 ${nextPet} 미용이 있어요`
          : `${nextPet} 미용이 ${daysUntil(next.date, now)}일 남았어요`;
  } else if (duePet) {
    headline = `${duePet.name} 미용할 때가 됐어요`;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-mint-700">안녕하세요, {DEMO_USER.name}님</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink md:text-[2rem]">
        {headline}
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {next ? (
          <UpcomingCard
            booking={next}
            pet={pets.find((p) => p.id === next.petId)}
            more={upcoming.length - 1}
            now={now}
          />
        ) : (
          <div className="flex flex-col justify-center rounded-3xl bg-white p-5 ring-1 ring-cream-200">
            <p className="text-base font-bold text-ink">다가오는 예약이 없어요</p>
            <p className="mt-1 text-sm text-ink-muted">
              {duePet
                ? `${josa(duePet.name, "은는")} 지금 예약하기 좋은 시기예요.`
                : "가까운 미용실의 빈 시간을 바로 확인해보세요."}
            </p>
            <Link
              href={duePet ? `/booking?pet=${duePet.id}&step=1` : "/booking"}
              className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
            >
              <CalendarCheck className="h-4 w-4" aria-hidden />
              예약하기
            </Link>
          </div>
        )}

        {/* 아이별 상태와 바로 예약 */}
        <section
          className="rounded-3xl bg-white ring-1 ring-cream-200"
          aria-labelledby="my-pets-title"
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 id="my-pets-title" className="text-base font-extrabold text-ink">
              우리 아이들
            </h2>
            <Link href="/pets" className="text-sm font-semibold text-ink-muted hover:text-ink">
              관리
            </Link>
          </div>
          {pets.length === 0 ? (
            <div className="px-5 pb-5 pt-3">
              <p className="text-sm text-ink-muted">
                반려동물을 등록하면 아이별로 예약·미용 시기를 챙겨드려요.
              </p>
              <Link
                href="/pets?add=1"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta tap"
              >
                <Plus className="h-4 w-4" aria-hidden />
                반려동물 등록
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-cream-200 px-5 pb-2">
              {statuses.map(({ pet, text, tone }) => (
                <li key={pet.id} className="flex items-center gap-3 py-3">
                  <PetAvatar pet={pet} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-ink">{pet.name}</p>
                    <p
                      className={`truncate text-sm ${
                        tone === "coral"
                          ? "font-semibold text-coral-700"
                          : tone === "mint"
                            ? "text-mint-700"
                            : "text-ink-muted"
                      }`}
                    >
                      {text}
                    </p>
                  </div>
                  <Link
                    href={`/booking?pet=${pet.id}&step=1`}
                    className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:ring-mint-400 hover:text-mint-700 tap"
                    aria-label={`${pet.name} 미용 예약하기`}
                  >
                    예약
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function UpcomingCard({
  booking,
  pet,
  more,
  now,
}: {
  booking: Booking;
  pet?: Pet;
  more: number;
  now: Date;
}) {
  const service = getServiceById(booking.serviceId);
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);
  const stage = bookingStage(booking, now);
  const days = daysUntil(booking.date, now);

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200">
      <Link
        href={`/bookings/${booking.id}`}
        className="flex gap-3.5 p-4 transition-colors hover:bg-cream-50 md:p-5"
      >
        {salon && (
          <span
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${salon.gradient}`}
          >
            <Image src={salon.image} alt="" fill sizes="64px" className="object-cover" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STAGE_STYLE[stage]}`}>
              {STAGE_LABEL[stage]}
            </span>
            {stage === "upcoming" && (
              <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">
                D-{days}
              </span>
            )}
          </span>
          <span className="mt-1.5 block text-lg font-extrabold leading-snug text-ink">
            {formatDateShortKo(booking.date)} {booking.time}
          </span>
          <span className="block truncate text-base text-ink-soft">
            {pet?.name ?? "반려동물"} · {service?.name}
          </span>
          <span className="block truncate text-sm text-ink-muted">
            {salon?.name} · {groomer?.name}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-ink-faint" aria-hidden />
      </Link>
      <div className="flex items-center justify-between border-t border-cream-200 px-5 py-3 text-sm">
        <Link
          href={`/bookings/${booking.id}`}
          className="font-semibold text-mint-700 hover:underline"
        >
          {stage === "today" ? "오늘 방문 안내 보기" : "방문 전 준비 확인하기"}
        </Link>
        {more > 0 && (
          <Link href="/bookings" className="font-semibold text-ink-muted hover:text-ink">
            예정 {more}건 더
          </Link>
        )}
      </div>
    </div>
  );
}
