"use client";

import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Expand,
  NotebookPen,
  Pencil,
  RotateCcw,
  SearchX,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import PetDialog from "@/components/pets/PetDialog";
import EmptyState from "@/components/ui/EmptyState";
import PhotoViewer from "@/components/ui/PhotoViewer";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { useBookingDraft } from "@/lib/booking-context";
import { REBOOK_STEP, rebookDraft } from "@/lib/booking-rules";
import { getGroomerById, getSalonById, getSeedReviews, getServiceById } from "@/lib/data";
import { useDb } from "@/lib/db";
import { formatDateShortKo, formatMonthDay, formatWon } from "@/lib/format";
import { daysUntil, isActive, nextGroomingDate, petHistory } from "@/lib/lifecycle";
import { relativeDay } from "@/lib/reviews";
import { petInsights } from "@/lib/pet-insights";
import type { Booking, Pet } from "@/lib/types";
import { useNow } from "@/lib/use-now";

/**
 * 우리 아이 프로필 — 한 아이의 미용 기록과 다음 할 일을 한 화면에.
 * 몇 번·언제·어디서 받았는지, 다음 미용은 언제쯤인지, 자주 가는 미용실에서 같은 조건으로 바로 예약.
 */
export default function PetProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { pets, bookings, reviews, hydrated } = useDb();
  const { setDraft } = useBookingDraft();
  const now = useNow();
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);

  if (!hydrated || !now) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10" aria-hidden>
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="skeleton mt-4 h-[26rem] rounded-3xl" />
      </div>
    );
  }

  const pet = pets.find((p) => p.id === id);
  if (!pet) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <EmptyState
          icon={SearchX}
          title="반려동물 정보를 찾을 수 없어요"
          desc="삭제했거나 잘못된 링크일 수 있어요."
          actionHref="/pets"
          actionLabel="내 반려동물로"
          titleAs="h1"
        />
      </div>
    );
  }

  const { last, visits } = petHistory(pet.id, bookings);
  const upcoming = bookings
    .filter((b) => b.petId === pet.id && isActive(b))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const history = bookings
    .filter((b) => b.petId === pet.id && b.status === "completed")
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  const insights = petInsights(pet.id, bookings);
  const next = last ? nextGroomingDate(last) : null;
  const nextLeft = next ? daysUntil(next, now) : null;
  const seedReviews = getSeedReviews(now);
  const reviewOf = (b: Booking) =>
    reviews.find((r) => r.bookingId === b.id) ?? seedReviews.find((r) => r.bookingId === b.id);

  const rebook = (b: Booking) => {
    setDraft(rebookDraft(b));
    router.push(`/booking?step=${REBOOK_STEP}`);
  };
  const book = () => {
    setDraft({ petId: pet.id });
    router.push(`/booking?pet=${pet.id}&step=1`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-10">
      <Link
        href="/pets"
        className="-ml-1 inline-flex items-center gap-0.5 rounded-lg px-1 py-1 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />내 반려동물
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* 프로필 */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink/[0.04] lg:sticky lg:top-24">
          <ProfilePhoto pet={pet} onView={() => setViewing(true)} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="break-all text-2xl font-bold tracking-tight text-ink">{pet.name}</h1>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {pet.breed} · {pet.age}살 · {pet.weight}kg
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-ink-soft">
                {pet.species === "dog" ? "강아지" : "고양이"}
              </span>
            </div>
            {pet.note && (
              <p className="mt-3 flex gap-2 rounded-2xl bg-cream-50 px-3.5 py-3 text-sm leading-relaxed text-ink-soft">
                <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <span>
                  <span className="sr-only">특이사항: </span>
                  {pet.note}
                </span>
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={book}
                className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-mint-500 py-3.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
              >
                <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">미용 예약하기</span>
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex shrink-0 items-center justify-center gap-1 rounded-2xl bg-white px-4 text-sm font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:ring-mint-400 tap"
                aria-label={`${pet.name} 정보 수정`}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                수정
              </button>
            </div>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          {/* 한눈에 보는 미용 현황 */}
          <dl className="grid grid-cols-3 divide-x divide-cream-200 rounded-3xl bg-white py-4 text-center ring-1 ring-cream-200">
            <Stat label="미용 횟수" value={`${visits}회`} />
            <Stat label="마지막 미용" value={last ? formatMonthDay(last.date) : "기록 없음"} />
            <Stat
              label="다음 추천"
              value={next ? formatMonthDay(next) : "-"}
              tone={nextLeft !== null && nextLeft <= 7 && upcoming.length === 0 ? "coral" : "ink"}
            />
          </dl>

          {/* 다가오는 예약 */}
          {upcoming.length > 0 && (
            <section aria-labelledby="pet-upcoming">
              <h2 id="pet-upcoming" className="text-lg font-bold tracking-tight text-ink">
                다가오는 예약
              </h2>
              <ul className="mt-3 space-y-2.5">
                {upcoming.map((b) => (
                  <li key={b.id}>
                    <BookingLine booking={b} now={now} upcoming />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 자주 가는 곳 · 다시 예약 */}
          {insights.favoriteSalon && insights.lastAtFavorite && (
            <section
              aria-labelledby="pet-regular"
              className="flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-3xl bg-mint-50 p-4 md:p-5"
            >
              <span
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${insights.favoriteSalon.salon.gradient}`}
              >
                <Image
                  src={insights.favoriteSalon.salon.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="pet-regular" className="text-xs font-semibold text-mint-800">
                  자주 가는 미용실
                </h2>
                <p className="truncate text-base font-bold text-ink">
                  {insights.favoriteSalon.salon.name}
                </p>
                <p className="truncate text-sm text-ink-muted">
                  {insights.favoriteSalon.count}회 방문
                  {insights.favoriteGroomer && ` · ${insights.favoriteGroomer.name} 미용사`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => rebook(insights.lastAtFavorite!)}
                className="flex w-full items-center justify-center gap-1 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-mint-700 shadow-card transition-colors hover:bg-mint-100 tap sm:w-auto sm:shrink-0"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                같은 조건으로 다시 예약
              </button>
            </section>
          )}

          {/* 미용 기록 */}
          <section aria-labelledby="pet-history">
            <div className="flex items-end justify-between">
              <h2 id="pet-history" className="text-lg font-bold tracking-tight text-ink">
                미용 기록
              </h2>
              {insights.averageCycleDays && (
                <p className="text-sm text-ink-muted">
                  평균 {Math.round(insights.averageCycleDays / 7)}주마다
                </p>
              )}
            </div>
            {history.length === 0 ? (
              <div className="mt-3 rounded-3xl bg-white px-5 py-8 text-center ring-1 ring-cream-200">
                <p className="text-base font-bold text-ink">아직 미용 기록이 없어요</p>
                <p className="mt-1 text-sm text-ink-muted">
                  첫 미용을 마치면 날짜·미용실·후기가 이곳에 차곡차곡 쌓여요.
                </p>
              </div>
            ) : (
              <ol className="mt-3">
                {history.map((b, i) => {
                  const review = reviewOf(b);
                  const service = getServiceById(b.serviceId);
                  const salon = getSalonById(b.salonId);
                  const groomer = getGroomerById(b.groomerId);
                  return (
                    <li key={b.id} className="relative flex gap-3.5 pb-4 last:pb-0">
                      {/* 타임라인 선 */}
                      {i < history.length - 1 && (
                        <span
                          className="absolute bottom-0 left-[1.2rem] top-11 w-px bg-cream-300"
                          aria-hidden
                        />
                      )}
                      {service && <ServiceIcon serviceId={service.id} size="sm" />}
                      <Link
                        href={`/bookings/${b.id}`}
                        className="min-w-0 flex-1 rounded-2xl bg-white p-4 ring-1 ring-cream-200 transition-shadow hover:shadow-card"
                      >
                        <span className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-semibold text-ink-soft">
                            {formatDateShortKo(b.date)}
                            <span className="font-normal text-ink-faint">
                              {" "}
                              · {relativeDay(b.date, now)}
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold text-ink-soft">
                            {formatWon(b.total)}
                          </span>
                        </span>
                        <span className="mt-1 block text-base font-bold text-ink">
                          {service?.name}
                        </span>
                        <span className="block truncate text-sm text-ink-muted">
                          {salon?.name} · {groomer?.name} 미용사
                        </span>
                        {b.request && b.request.tags.length > 0 && (
                          <span className="mt-2 flex flex-wrap gap-1">
                            {b.request.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-ink-soft"
                              >
                                {t}
                              </span>
                            ))}
                          </span>
                        )}
                        {review ? (
                          <span className="mt-2.5 flex items-center gap-1.5 border-t border-cream-200 pt-2.5 text-sm text-ink-soft">
                            <Star
                              className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400"
                              aria-hidden
                            />
                            <span className="font-semibold">{review.rating}.0</span>
                            <span className="truncate text-ink-muted">
                              {review.content || review.keywords?.join(" · ")}
                            </span>
                          </span>
                        ) : (
                          <span className="mt-2.5 flex items-center justify-between border-t border-cream-200 pt-2.5 text-sm font-semibold text-coral-700">
                            후기를 기다리고 있어요
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>

      {viewing && pet.image && (
        <PhotoViewer
          src={pet.image}
          alt={pet.name}
          caption={`${pet.name} · ${pet.breed} (${pet.age}살) · ${pet.weight}kg`}
          onClose={() => setViewing(false)}
        />
      )}
      {editing && (
        <PetDialog
          initial={pet}
          onClose={() => setEditing(false)}
          onRemoved={() => router.push("/pets")}
        />
      )}
    </div>
  );
}

function ProfilePhoto({ pet, onView }: { pet: Pet; onView: () => void }) {
  const bg =
    pet.species === "cat"
      ? "bg-gradient-to-br from-coral-100 to-cream-200"
      : "bg-gradient-to-br from-mint-100 to-mint-200";
  if (!pet.image) {
    return (
      <div
        className={`flex aspect-[4/3] items-center justify-center text-[6rem] lg:aspect-square ${bg}`}
        role="img"
        aria-label={pet.name}
      >
        {pet.emoji}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onView}
      className={`group relative block aspect-[4/3] w-full overflow-hidden lg:aspect-square ${bg}`}
      aria-label={`${pet.name} 사진 원본 보기`}
    >
      <Image
        src={pet.image}
        alt={pet.name}
        fill
        priority
        sizes="(min-width: 1024px) 22rem, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
        <Expand className="h-3.5 w-3.5" aria-hidden />
        원본 보기
      </span>
    </button>
  );
}

function Stat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "coral";
}) {
  return (
    <div className="min-w-0 px-2">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd
        className={`mt-1 truncate text-sm font-bold sm:text-base ${
          tone === "coral" ? "text-coral-700" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function BookingLine({
  booking,
  now,
  upcoming,
}: {
  booking: Booking;
  now: Date;
  upcoming?: boolean;
}) {
  const salon = getSalonById(booking.salonId);
  const service = getServiceById(booking.serviceId);
  const days = daysUntil(booking.date, now);
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="flex items-center gap-3.5 rounded-2xl bg-white p-3.5 ring-1 ring-cream-200 transition-shadow hover:shadow-card"
    >
      {salon && (
        <span
          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${salon.gradient}`}
        >
          <Image src={salon.image} alt="" fill sizes="56px" className="object-cover" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm text-ink-muted">
          {upcoming && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">
              {days <= 0 ? "오늘" : days === 1 ? "내일" : `D-${days}`}
            </span>
          )}
          <span className="truncate">{salon?.name}</span>
        </span>
        <span className="mt-1 block text-base font-bold text-ink">
          {formatDateShortKo(booking.date)} {booking.time}
        </span>
        <span className="block truncate text-sm text-ink-muted">{service?.name}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}
