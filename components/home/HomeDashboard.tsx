"use client";

import { CalendarCheck, CalendarPlus, ChevronRight, Plus, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { STAGE_LABEL } from "@/components/bookings/BookingDetail";
import PetAvatar from "@/components/ui/PetAvatar";
import { areaOf } from "@/components/ui/SalonRow";
import { COUPONS, DEMO_USER, getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { isCouponUsed } from "@/lib/coupons";
import { useDb } from "@/lib/db";
import { formatDateShortKo } from "@/lib/format";
import { josa } from "@/lib/josa";
import {
  bookingStage,
  daysUntil,
  isActive,
  nextGroomingDate,
  petHistory,
  type BookingStage,
} from "@/lib/lifecycle";
import type { Booking, Pet } from "@/lib/types";
import { useNow } from "@/lib/use-now";

/** 아이별 지금 상태 — 예약이 있는지, 미용할 때가 됐는지 */
function petStatus(pet: Pet, bookings: Booking[], now: Date) {
  const { last, upcoming } = petHistory(pet.id, bookings);
  if (upcoming) {
    const left = daysUntil(upcoming.date, now);
    return {
      tone: "mint" as const,
      text: `${formatDateShortKo(upcoming.date)} 예약 있음`,
      chip: left <= 0 ? "오늘" : left === 1 ? "내일" : `D-${left}`,
      due: false,
    };
  }
  if (!last) return { tone: "muted" as const, text: "아직 미용 기록이 없어요", due: false };
  const next = nextGroomingDate(last);
  const left = daysUntil(next, now);
  if (left < 0) {
    return {
      tone: "coral" as const,
      text: `미용 시기가 ${-left}일 지났어요`,
      chip: "미용할 때",
      due: true,
    };
  }
  if (left <= 7) {
    return {
      tone: "coral" as const,
      text: `${left === 0 ? "오늘" : `${left}일 뒤`}가 미용 추천일이에요`,
      chip: "미용할 때",
      due: true,
    };
  }
  return { tone: "muted" as const, text: `다음 미용 추천 ${formatDateShortKo(next)}`, due: false };
}

/**
 * 홈 상단 — 로그인한 보호자가 매번 가장 먼저 확인할 것:
 * 다가오는 예약(매장 사진이 있는 예약 카드), 아이별 '예약이 있는지 / 미용할 때가 됐는지', 쓸 수 있는 쿠폰.
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
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]" aria-hidden>
          <div className="skeleton h-[19rem] rounded-3xl" />
          <div className="skeleton h-[13rem] rounded-3xl" />
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
  const usableCoupons = COUPONS.filter((c) => !isCouponUsed(c, { bookings }));

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
      <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-ink md:text-[2.1rem] md:leading-tight">
        {headline}
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-7 md:mt-7 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
        <div className="min-w-0">
          {next ? (
            <UpcomingTicket
              booking={next}
              pet={pets.find((p) => p.id === next.petId)}
              more={upcoming.length - 1}
              now={now}
            />
          ) : (
            <NoUpcoming duePet={duePet} />
          )}
          {usableCoupons.length > 0 && (
            <Link
              href="/my#coupons"
              className="mt-3 flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-cream-200 transition-colors hover:bg-white"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                <Ticket className="h-[1.1rem] w-[1.1rem]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">
                  쓸 수 있는 쿠폰 {usableCoupons.length}장
                </span>
                <span className="block truncate text-xs text-ink-muted">
                  예약할 때 가장 큰 할인이 자동으로 적용돼요
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
            </Link>
          )}
        </div>

        {/* 아이별 상태와 바로 예약 */}
        <section aria-labelledby="my-pets-title" className="min-w-0">
          <div className="flex items-end justify-between">
            <h2 id="my-pets-title" className="text-lg font-bold tracking-tight text-ink">
              우리 아이들
            </h2>
            <Link
              href="/pets"
              className="text-sm font-semibold text-ink-muted transition-colors hover:text-mint-700"
            >
              관리
            </Link>
          </div>
          {pets.length === 0 ? (
            <div className="mt-3 rounded-3xl bg-white p-5 ring-1 ring-cream-200">
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
            <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
              {statuses.map(({ pet, text, tone, chip }) => (
                <li key={pet.id} className="w-[9.75rem] shrink-0 snap-start md:w-auto">
                  <PetTile pet={pet} text={text} tone={tone} chip={chip} />
                </li>
              ))}
              <li className="w-[9.75rem] shrink-0 snap-start md:w-auto">
                <Link
                  href="/pets?add=1"
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-3xl border border-dashed border-cream-300 bg-white/50 text-sm font-semibold text-ink-muted transition-colors hover:border-mint-300 hover:text-mint-700"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-cream-300">
                    <Plus className="h-5 w-5" aria-hidden />
                  </span>
                  새 가족 등록
                </Link>
              </li>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** 아이 한 명 — 사진이 주인공. 누르면 그 아이로 예약을 시작한다. */
function PetTile({
  pet,
  text,
  tone,
  chip,
}: {
  pet: Pet;
  text: string;
  tone: "mint" | "coral" | "muted";
  chip?: string;
}) {
  const statusId = `pet-status-${pet.id}`;
  return (
    <Link
      href={`/booking?pet=${pet.id}&step=1`}
      aria-label={`${pet.name} 미용 예약하기`}
      aria-describedby={statusId}
      className="group block"
    >
      <span
        className={`relative block aspect-square overflow-hidden rounded-3xl ${
          pet.species === "cat"
            ? "bg-gradient-to-br from-coral-100 to-cream-200"
            : "bg-gradient-to-br from-mint-100 to-mint-200"
        }`}
      >
        {pet.image ? (
          <Image
            src={pet.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 12rem, (min-width: 768px) 22vw, 156px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden>
            {pet.emoji}
          </span>
        )}
        {chip && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-xs font-bold ${
              tone === "coral" ? "bg-coral-600 text-white" : "bg-white/95 text-ink"
            }`}
            aria-hidden
          >
            {chip}
          </span>
        )}
        <span
          className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-mint-700 shadow-card transition-transform group-hover:scale-105"
          aria-hidden
        >
          <CalendarPlus className="h-[1.1rem] w-[1.1rem]" />
        </span>
      </span>
      <span className="mt-2 block truncate px-0.5 text-base font-bold text-ink">{pet.name}</span>
      <span
        id={statusId}
        className={`block truncate px-0.5 text-sm ${
          tone === "coral"
            ? "font-semibold text-coral-700"
            : tone === "mint"
              ? "text-mint-700"
              : "text-ink-muted"
        }`}
      >
        {text}
      </span>
    </Link>
  );
}

const TICKET_STEPS: { key: BookingStage; label: string }[] = [
  { key: "upcoming", label: "예약 확정" },
  { key: "tomorrow", label: "방문 전날" },
  { key: "today", label: "방문 당일" },
  { key: "done", label: "이용 완료" },
];

/**
 * 다가오는 예약 — 매장 사진 위에 단계·D-day, 아래에 일시와 진행 단계.
 * (배달 앱의 '주문 진행' 카드처럼, 지금 어디쯤인지 한눈에)
 */
function UpcomingTicket({
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
  const current = Math.max(
    0,
    TICKET_STEPS.findIndex((s) => s.key === stage)
  );

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink/[0.04]">
      <Link href={`/bookings/${booking.id}`} className="group block">
        <span
          className={`relative block h-32 overflow-hidden bg-gradient-to-br md:h-40 ${salon?.gradient ?? ""}`}
        >
          {salon && (
            <Image
              src={salon.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          )}
          <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
          <span className="absolute left-4 top-3.5 flex items-center gap-1.5">
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-mint-800">
              {STAGE_LABEL[stage]}
            </span>
            {stage === "upcoming" && (
              <span className="rounded-full bg-ink/80 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
                D-{days}
              </span>
            )}
          </span>
          <span className="absolute inset-x-4 bottom-3 block pr-16">
            <span className="block truncate text-base font-bold text-white">{salon?.name}</span>
            <span className="block truncate text-sm text-white/85">
              {salon && areaOf(salon.address)} · {groomer?.name} 미용사
            </span>
          </span>
        </span>

        <span className="relative block px-5 pb-5 pt-4">
          {pet && (
            <span className="absolute -top-10 right-4 rounded-full ring-4 ring-white">
              <PetAvatar pet={pet} size="lg" />
            </span>
          )}
          <span className="block text-xl font-bold tracking-tight text-ink md:text-2xl">
            {formatDateShortKo(booking.date)} {booking.time}
          </span>
          <span className="mt-0.5 block truncate text-sm text-ink-muted">
            {pet?.name ?? "반려동물"} · {service?.name}
          </span>

          {/* 진행 단계 */}
          <span className="mt-4 block" aria-hidden>
            <span className="grid grid-cols-4 gap-1">
              {TICKET_STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={`h-1.5 rounded-full ${
                    i < current ? "bg-mint-500" : i === current ? "bg-mint-500" : "bg-cream-200"
                  }`}
                />
              ))}
            </span>
            <span className="mt-1.5 grid grid-cols-4 gap-1 text-xs">
              {TICKET_STEPS.map((s, i) => (
                <span
                  key={s.key}
                  className={i === current ? "font-bold text-mint-700" : "text-ink-faint"}
                >
                  {s.label}
                </span>
              ))}
            </span>
          </span>
        </span>
      </Link>
      <div className="flex items-center justify-between gap-3 border-t border-cream-200 px-5 py-3 text-sm">
        <Link
          href={`/bookings/${booking.id}`}
          className="flex items-center gap-1 font-semibold text-mint-700 hover:underline"
        >
          {stage === "today" ? "오늘 방문 안내 보기" : "방문 전 준비 확인하기"}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
        {more > 0 && (
          <Link href="/bookings" className="font-semibold text-ink-muted hover:text-ink">
            예정 {more}건 더
          </Link>
        )}
      </div>
    </article>
  );
}

function NoUpcoming({ duePet }: { duePet?: Pet }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/[0.04]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-50 text-mint-700">
        <CalendarCheck className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-bold text-ink">다가오는 예약이 없어요</p>
      <p className="mt-1 text-sm text-ink-muted">
        {duePet
          ? `${josa(duePet.name, "은는")} 지금 예약하기 좋은 시기예요.`
          : "가까운 미용실의 빈 시간을 바로 확인해보세요."}
      </p>
      <Link
        href={duePet ? `/booking?pet=${duePet.id}&step=1` : "/booking"}
        className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-xl bg-mint-500 px-5 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden />
        예약하기
      </Link>
    </div>
  );
}
