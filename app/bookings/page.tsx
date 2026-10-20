"use client";

import { CalendarDays, ChevronRight, History, PenLine, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ReviewSheet } from "@/components/bookings/BookingSheets";
import { STAGE_LABEL, STAGE_STYLE, useMyReview } from "@/components/bookings/BookingDetail";
import EmptyState from "@/components/ui/EmptyState";
import PetAvatar from "@/components/ui/PetAvatar";
import { useBookingDraft } from "@/lib/booking-context";
import { REBOOK_STEP, rebookDraft } from "@/lib/booking-rules";
import { getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { useDb } from "@/lib/db";
import { formatDateShortKo, formatWon } from "@/lib/format";
import { bookingStage, daysUntil, isActive } from "@/lib/lifecycle";
import type { Booking, Pet } from "@/lib/types";
import { useNow } from "@/lib/use-now";

type Tab = "upcoming" | "past";

export default function BookingsPage() {
  const { bookings, pets, reviews, hydrated } = useDb();
  const { setDraft } = useBookingDraft();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  // 아이별로 보기 ('all' 또는 반려동물 id)
  const [petFilter, setPetFilter] = useState<string>("all");

  const rebook = (booking: Booking) => {
    setDraft(rebookDraft(booking));
    router.push(`/booking?step=${REBOOK_STEP}`);
  };

  const { upcoming, past } = useMemo(() => {
    const byDate = (a: Booking, b: Booking) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
    const mine = bookings.filter((b) => petFilter === "all" || b.petId === petFilter);
    return {
      upcoming: mine.filter(isActive).sort(byDate),
      past: mine.filter((b) => !isActive(b)).sort((a, b) => byDate(b, a)),
    };
  }, [bookings, petFilter]);

  // 후기를 아직 안 쓴 이용 완료 예약 수 — 지난 내역 탭에 표시
  const pendingReviews = past.filter(
    (b) => b.status === "completed" && !b.reviewed && !reviews.some((r) => r.bookingId === b.id)
  ).length;

  const list = tab === "upcoming" ? upcoming : past;
  // 지난 내역은 달별로 묶는다
  const groups: { key: string; label: string | null; items: Booking[] }[] =
    tab === "past"
      ? [...new Set(list.map((b) => b.date.slice(0, 7)))].map((ym) => ({
          key: ym,
          label: `${Number(ym.slice(0, 4))}년 ${Number(ym.slice(5, 7))}월`,
          items: list.filter((b) => b.date.startsWith(ym)),
        }))
      : [{ key: "all", label: null, items: list }];
  const filteredPet = pets.find((p) => p.id === petFilter);
  // 기록이 있는 아이만 칩으로 (둘 이상일 때)
  const petsWithBookings = pets.filter((p) => bookings.some((b) => b.petId === p.id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">예약 내역</h1>

      {/* 탭 */}
      <div className="mt-5 flex rounded-2xl bg-cream-200/70 p-1 md:max-w-md" role="tablist">
        {(
          [
            ["upcoming", `예정된 예약${hydrated ? ` ${upcoming.length}` : ""}`],
            ["past", `지난 내역${hydrated ? ` ${past.length}` : ""}`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
              tab === key ? "bg-white text-ink shadow-card" : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
            {key === "past" && hydrated && pendingReviews > 0 && (
              <span className="rounded-full bg-coral-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
                <span className="sr-only">, </span>후기 {pendingReviews}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 아이별로 보기 */}
      {hydrated && petsWithBookings.length >= 2 && (
        <div
          className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0"
          role="group"
          aria-label="아이별로 보기"
        >
          <PetChip on={petFilter === "all"} onClick={() => setPetFilter("all")}>
            전체
          </PetChip>
          {petsWithBookings.map((pet) => (
            <PetChip
              key={pet.id}
              on={petFilter === pet.id}
              onClick={() => setPetFilter(pet.id)}
              pet={pet}
            >
              {pet.name}
            </PetChip>
          ))}
        </div>
      )}

      <div
        className="mt-5 grid grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-4"
        role="tabpanel"
      >
        {!hydrated &&
          [0, 1].map((i) => <div key={i} className="skeleton h-[9.5rem] rounded-3xl" />)}

        {hydrated && list.length === 0 && (
          <div className="lg:col-span-2">
            <EmptyState
              icon={tab === "upcoming" ? CalendarDays : History}
              title={`${filteredPet ? `${filteredPet.name}의 ` : ""}${
                tab === "upcoming" ? "예정된 예약이 없어요" : "지난 이용 내역이 없어요"
              }`}
              desc={
                tab === "upcoming"
                  ? past.length > 0
                    ? "지난 내역에서 같은 조건으로 바로 다시 예약할 수 있어요."
                    : "우리 아이를 위한 첫 미용을 예약해보세요."
                  : "미용을 받고 나면 이곳에서 후기를 남길 수 있어요."
              }
              actionHref={filteredPet ? `/booking?pet=${filteredPet.id}&step=1` : "/booking"}
              actionLabel={filteredPet ? `${filteredPet.name} 예약하기` : "예약하러 가기"}
            />
          </div>
        )}

        {hydrated &&
          groups.map((group) => (
            <Fragment key={group.key}>
              {group.label && (
                <h2 className="mt-3 px-1 text-sm font-bold text-ink-muted first:mt-0 lg:col-span-2">
                  {group.label}
                  <span className="ml-1.5 font-medium text-ink-faint">{group.items.length}건</span>
                </h2>
              )}
              {group.items.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  pet={pets.find((p) => p.id === booking.petId)}
                  onReview={() => setReviewTarget(booking)}
                  onRebook={() => rebook(booking)}
                />
              ))}
            </Fragment>
          ))}
      </div>

      {reviewTarget && (
        <ReviewSheet
          booking={reviewTarget}
          petName={pets.find((p) => p.id === reviewTarget.petId)?.name ?? ""}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}

/** 예약 한 건 요약 — 누르면 예약 상세. 지난 예약은 후기·다시 예약을 바로 할 수 있다. */
function BookingCard({
  booking,
  pet,
  onReview,
  onRebook,
}: {
  booking: Booking;
  pet?: Pet;
  onReview: () => void;
  onRebook: () => void;
}) {
  const now = useNow();
  const myReview = useMyReview(booking.id);
  const service = getServiceById(booking.serviceId);
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);
  const stage = now ? bookingStage(booking, now) : null;
  const days = now ? daysUntil(booking.date, now) : null;
  const reviewable = booking.status === "completed" && !booking.reviewed && !myReview;

  return (
    <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200 transition-shadow animate-fade-in-up hover:shadow-card">
      <Link
        href={`/bookings/${booking.id}`}
        className="flex gap-3.5 p-4 transition-colors hover:bg-cream-50 md:p-5"
      >
        {pet ? (
          <PetAvatar pet={pet} size="md" />
        ) : (
          <span className="h-14 w-14 shrink-0 rounded-full bg-cream-200" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {stage ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STAGE_STYLE[stage]}`}
                >
                  {STAGE_LABEL[stage]}
                </span>
              ) : (
                <span className="inline-block h-5 w-16 rounded-full bg-cream-200" />
              )}
              {stage === "upcoming" && days !== null && (
                <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">
                  D-{days}
                </span>
              )}
              {booking.previous && isActive(booking) && (
                <span className="text-xs font-semibold text-ink-muted">일정 변경됨</span>
              )}
            </div>
            <span
              className={`shrink-0 text-sm font-bold ${
                booking.status === "cancelled" ? "text-ink-faint line-through" : "text-ink"
              }`}
            >
              {formatWon(booking.total)}
            </span>
          </div>
          <p className="mt-2 text-base font-bold leading-snug text-ink">
            {formatDateShortKo(booking.date)} {booking.time}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink-soft">
            {pet?.name ?? "반려동물"} · {service?.name}
          </p>
          <p className="flex items-center gap-1 truncate text-sm text-ink-muted">
            <span className="truncate">
              {salon?.name} · {groomer?.name} 미용사
            </span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          </p>
        </div>
      </Link>

      {!isActive(booking) && (
        <div className="flex gap-2 border-t border-cream-200 px-4 py-3 md:px-5">
          {reviewable && (
            <button
              type="button"
              onClick={onReview}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-mint-500 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
            >
              <PenLine className="h-4 w-4" aria-hidden />
              후기 작성
            </button>
          )}
          <button
            type="button"
            onClick={onRebook}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-sm font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:ring-mint-400 tap"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            다시 예약
          </button>
        </div>
      )}
    </article>
  );
}

function PetChip({
  on,
  onClick,
  pet,
  children,
}: {
  on: boolean;
  onClick: () => void;
  pet?: Pet;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex shrink-0 items-center gap-1.5 rounded-full py-1.5 text-sm font-semibold transition-colors tap ${
        pet ? "pl-1.5 pr-3.5" : "px-4"
      } ${
        on
          ? "bg-ink text-white"
          : "bg-white text-ink-soft ring-1 ring-cream-300 hover:ring-ink-faint"
      }`}
    >
      {pet && <PetAvatar pet={pet} size="xs" />}
      {children}
    </button>
  );
}
