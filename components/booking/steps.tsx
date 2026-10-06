"use client";

import {
  CalendarDays,
  Check,
  Clock,
  Info,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Calendar from "@/components/booking/Calendar";
import { PriceSummary } from "@/components/booking/SummaryCard";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import PetAvatar from "@/components/ui/PetAvatar";
import SalonRow from "@/components/ui/SalonRow";
import { RatingBadge } from "@/components/ui/Stars";
import type { BookingDraft } from "@/lib/booking-context";
import { isServiceForPet } from "@/lib/booking-rules";
import {
  getGroomerById,
  getGroomersBySalon,
  getSalonById,
  getServiceById,
  SALONS,
  SERVICES,
} from "@/lib/data";
import { formatDateKo, formatDateShortKo, formatWon, toDateKey } from "@/lib/format";
import { countReviews, useDb } from "@/lib/db";
import { getSlots, isDayFullyBooked, isSlotBookable } from "@/lib/slots";
import type { Booking, Pet } from "@/lib/types";

interface StepProps {
  draft: BookingDraft;
  setDraft: (patch: Partial<BookingDraft>) => void;
}

/* -------------------------------- 1. 반려동물 -------------------------------- */

export function PetStep({
  draft,
  setDraft,
  pets,
  hydrated,
  onChosen,
}: StepProps & { pets: Pet[]; hydrated: boolean; onChosen?: () => void }) {
  if (!hydrated) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {pets.map((pet) => {
          const selected = draft.petId === pet.id;
          return (
            <button
              key={pet.id}
              type="button"
              onClick={() => {
                // 새로 고른 아이가 받을 수 없는 서비스가 남아 있으면 비운다
                const service = getServiceById(draft.serviceId);
                setDraft({
                  petId: pet.id,
                  ...(service && !isServiceForPet(service, pet)
                    ? { serviceId: null }
                    : {}),
                });
                onChosen?.();
              }}
              className={`relative flex min-w-0 flex-col items-center rounded-3xl border-2 bg-white p-2.5 pb-3.5 text-center shadow-card transition-all duration-200 tap md:p-3 md:pb-4 ${
                selected
                  ? "border-mint-500 bg-mint-50/60"
                  : "border-transparent hover:border-mint-200"
              }`}
              aria-pressed={selected}
            >
              <PetPhoto pet={pet} />
              <p className="mt-2.5 w-full truncate text-base font-bold text-ink">
                {pet.name}
              </p>
              <p className="w-full truncate text-xs text-ink-muted">
                {pet.breed} · {pet.age}살
              </p>
              {selected && (
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-mint-500 text-white shadow-cta">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <Link
        href="/pets?add=1"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-cream-300 bg-white/60 p-3.5 text-sm font-bold text-ink-muted transition-colors hover:border-mint-300 hover:text-mint-600 tap"
      >
        <Plus className="h-4 w-4" />새 반려동물 등록하기
      </Link>
    </div>
  );
}

/** 반려동물 정사각 사진 (사진이 없으면 큰 이모지) */
function PetPhoto({ pet }: { pet: Pet }) {
  const bg =
    pet.species === "cat"
      ? "bg-gradient-to-br from-coral-100 to-cream-200"
      : "bg-gradient-to-br from-mint-100 to-mint-200";
  return (
    <span className={`relative block aspect-square w-full overflow-hidden rounded-2xl ${bg}`}>
      {pet.image ? (
        <Image
          src={pet.image}
          alt={pet.name}
          fill
          sizes="(min-width: 1024px) 14rem, 30vw"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-5xl" aria-hidden>
          {pet.emoji}
        </span>
      )}
    </span>
  );
}

/* -------------------------------- 2. 서비스 --------------------------------- */

export function ServiceStep({
  draft,
  setDraft,
  pets,
  onChosen,
}: StepProps & { pets: Pet[]; onChosen?: () => void }) {
  const pet = pets.find((p) => p.id === draft.petId);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SERVICES.map((service) => {
        const selected = draft.serviceId === service.id;
        const unavailable = Boolean(pet && !isServiceForPet(service, pet));
        return (
          <button
            key={service.id}
            type="button"
            disabled={unavailable}
            onClick={() => {
              setDraft({ serviceId: service.id });
              onChosen?.();
            }}
            // 모바일은 한 줄 요약형(아이콘·이름·가격), 넓은 화면은 설명이 있는 카드형
            className={`relative flex items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-card transition-all duration-200 sm:flex-col sm:items-stretch sm:gap-0 sm:p-5 ${
              unavailable
                ? "cursor-not-allowed border-transparent opacity-50"
                : selected
                  ? "border-mint-500 bg-mint-50/60 tap"
                  : "border-transparent hover:border-mint-200 tap"
            }`}
            aria-pressed={selected}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint-50 text-2xl sm:h-14 sm:w-14 sm:text-3xl">
              {service.emoji}
            </span>
            <div className="min-w-0 flex-1 sm:mt-3 sm:flex sm:flex-col">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold text-ink">
                {service.name}
                {unavailable ? (
                  <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-bold text-ink-muted">
                    {service.species === "cat" ? "고양이 전용" : "강아지 전용"}
                  </span>
                ) : (
                  service.popular && (
                    <span className="flex items-center gap-1 rounded-full bg-coral-100 px-2 py-0.5 text-xs font-bold text-coral-600">
                      <Sparkles className="h-3 w-3" />
                      인기
                    </span>
                  )
                )}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-mint-600 sm:whitespace-normal">
                {service.shortDesc}
              </p>
              <p className="mt-1.5 hidden text-xs leading-relaxed text-ink-muted sm:block">
                {service.desc}
              </p>
              {/* 설명 길이가 달라도 같은 줄의 카드끼리 가격 줄 높이를 맞춘다 */}
              <div className="mt-auto hidden items-center justify-between pt-4 sm:flex">
                <span className="text-lg font-extrabold text-ink">
                  {formatWon(service.price)}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-ink-faint">
                  <Clock className="h-3.5 w-3.5" />약 {service.durationMin}분
                </span>
              </div>
            </div>
            <span className="flex shrink-0 flex-col items-end sm:hidden">
              <span className="text-base font-extrabold text-ink">
                {formatWon(service.price)}
              </span>
              <span className="text-sm text-ink-faint">약 {service.durationMin}분</span>
            </span>
            {selected && (
              <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-mint-500 text-white shadow-cta">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
      <p className="flex items-start gap-1.5 text-xs text-ink-faint sm:col-span-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        견종, 털 길이, 체형 등에 따라 추가 요금이 발생할 수 있어요.
      </p>
    </div>
  );
}

/* -------------------------------- 3. 미용실 --------------------------------- */

export function SalonStep({
  draft,
  setDraft,
  onChosen,
}: StepProps & { onChosen?: () => void }) {
  const { reviews } = useDb();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SALONS.map((salon) => {
        const selected = draft.salonId === salon.id;
        const reviewCount =
          salon.reviewCount + countReviews(reviews, "salonId", salon.id);
        return (
          <button
            key={salon.id}
            type="button"
            onClick={() => {
              setDraft({
                salonId: salon.id,
                // 미용실이 바뀌면 미용사·시간 선택 초기화
                ...(draft.salonId !== salon.id
                  ? { groomerId: null, time: null }
                  : {}),
              });
              onChosen?.();
            }}
            className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-white text-left shadow-card transition-all duration-200 tap ${
              selected
                ? "border-mint-500 max-sm:bg-mint-50/60"
                : "border-transparent hover:border-mint-200"
            }`}
            aria-pressed={selected}
          >
            {/* 모바일: 한 줄 요약 */}
            <div className="flex items-center gap-2 p-3 sm:hidden">
              <div className="min-w-0 flex-1">
                <SalonRow salon={salon} reviewCount={reviewCount} />
              </div>
              <SelectCircle selected={selected} />
            </div>

            {/* 태블릿 이상: 사진 카드 */}
            <div
              className={`relative hidden aspect-[16/9] overflow-hidden bg-gradient-to-br sm:block ${salon.gradient}`}
            >
              <Image
                src={salon.image}
                alt={`${salon.name} 미용실`}
                fill
                sizes="(min-width: 640px) 24rem, 92vw"
                className="object-cover"
              />
              {salon.availableToday && (
                <span className="absolute left-3 top-3 rounded-full bg-mint-600/90 px-2.5 py-1 text-xs font-bold text-white">
                  오늘 예약 가능
                </span>
              )}
              {selected && (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-mint-500 text-white shadow-cta">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </div>
            <div className="hidden flex-1 flex-col p-4 sm:flex">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold text-ink">{salon.name}</p>
                <RatingBadge rating={salon.rating} reviewCount={reviewCount} />
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                <MapPin className="h-3.5 w-3.5" />
                {salon.distanceKm}km · {salon.openHours}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {salon.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-ink-soft"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-auto pt-2.5 text-sm text-ink-muted">
                <span className="font-extrabold text-ink">
                  {formatWon(salon.priceFrom)}
                </span>
                <span className="ml-1">부터</span>
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- 4. 미용사 --------------------------------- */

export function GroomerStep({
  draft,
  setDraft,
  onChosen,
}: StepProps & { onChosen?: () => void }) {
  const { reviews } = useDb();
  const groomers = draft.salonId ? getGroomersBySalon(draft.salonId) : [];

  if (!draft.salonId) {
    return (
      <p className="rounded-3xl bg-cream-100 p-6 text-center text-sm text-ink-muted">
        먼저 미용실을 선택해주세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groomers.map((groomer) => {
        const selected = draft.groomerId === groomer.id;
        return (
          <button
            key={groomer.id}
            type="button"
            onClick={() => {
              setDraft({
                groomerId: groomer.id,
                ...(draft.groomerId !== groomer.id ? { time: null } : {}),
              });
              onChosen?.();
            }}
            className={`flex w-full items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-card transition-all duration-200 tap ${
              selected
                ? "border-mint-500 bg-mint-50/60"
                : "border-transparent hover:border-mint-200"
            }`}
            aria-pressed={selected}
          >
            <GroomerAvatar groomer={groomer} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-base font-bold text-ink">
                {groomer.name}
                {groomer.premium && (
                  <span className="rounded-full bg-coral-100 px-2 py-0.5 text-2xs font-bold text-coral-600">
                    프리미엄
                  </span>
                )}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-ink-muted">
                <RatingBadge
                  rating={groomer.rating}
                  reviewCount={groomer.reviewCount + countReviews(reviews, "groomerId", groomer.id)}
                />
                <span>경력 {groomer.careerYears}년</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {groomer.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-mint-50 px-2.5 py-0.5 text-xs font-semibold text-mint-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <SelectCircle selected={selected} />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ 5. 날짜/시간 -------------------------------- */

export function DateTimeStep({
  draft,
  setDraft,
  bookings,
}: StepProps & { bookings: Booking[] }) {
  // new Date()는 hydration 불일치를 피하기 위해 마운트 후에만 사용한다
  const [now, setNow] = useState<Date | null>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  // 저장돼 있던 선택값이 그 사이 무효가 됐으면 비운다
  // (지난 날짜, 이미 지나간 시간, 다른 예약으로 잡힌 시간 등)
  useEffect(() => {
    if (!now || !draft.date) return;
    if (draft.date < toDateKey(now)) {
      setDraft({ date: null, time: null });
      return;
    }
    if (
      draft.time &&
      draft.groomerId &&
      !isSlotBookable(draft.date, draft.time, draft.groomerId, bookings, now)
    ) {
      setDraft({ time: null });
    }
  }, [now, draft.date, draft.time, draft.groomerId, bookings, setDraft]);

  if (!now) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-28 rounded-3xl" />
      </div>
    );
  }

  const slots =
    draft.date && draft.groomerId
      ? getSlots(draft.date, draft.groomerId, bookings, now)
      : [];
  const openCount = slots.filter((s) => s.available).length;
  const morning = slots.filter((s) => Number(s.time.slice(0, 2)) < 12);
  const afternoon = slots.filter((s) => Number(s.time.slice(0, 2)) >= 12);

  const pickDate = (dateKey: string) => {
    setDraft({ date: dateKey, time: null });
    // 모바일에서는 시간 선택이 달력 아래 화면 밖에 있으므로 바로 보이게 내려준다
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() =>
        timesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-card md:p-5">
        <Calendar
          selected={draft.date}
          onSelect={pickDate}
          today={now}
          isFullyBooked={(dateKey) =>
            Boolean(draft.groomerId) &&
            isDayFullyBooked(dateKey, draft.groomerId as string, bookings, now)
          }
        />
      </div>

      <div
        ref={timesRef}
        className={`scroll-mt-24 rounded-3xl border border-cream-200 bg-white p-4 shadow-card md:p-5 ${
          draft.date ? "" : "hidden lg:block"
        }`}
      >
        {draft.date ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-base font-bold text-ink">
                {formatDateShortKo(draft.date)}
              </p>
              {openCount > 0 && (
                <p className="text-sm font-semibold text-mint-600">
                  {openCount}개 시간 가능
                </p>
              )}
            </div>
            {openCount === 0 ? (
              <p className="mt-4 rounded-2xl bg-cream-100 p-4 text-center text-sm text-ink-muted">
                이 날은 예약이 모두 마감됐어요. 다른 날짜를 골라주세요.
              </p>
            ) : (
              <>
                <TimeGroup
                  label="오전"
                  slots={morning}
                  selected={draft.time}
                  onSelect={(time) => setDraft({ time })}
                />
                <TimeGroup
                  label="오후"
                  slots={afternoon}
                  selected={draft.time}
                  onSelect={(time) => setDraft({ time })}
                />
              </>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
            <CalendarDays className="h-9 w-9 text-mint-300" />
            <p className="mt-3 text-sm font-semibold text-ink-muted">
              날짜를 고르면 예약 가능한 시간이 보여요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeGroup({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: { time: string; available: boolean }[];
  selected: string | null;
  onSelect: (time: string) => void;
}) {
  if (slots.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {slots.map(({ time, available }) => {
          const isSelected = selected === time;
          return (
            <button
              key={time}
              type="button"
              disabled={!available}
              onClick={() => onSelect(time)}
              className={`h-11 rounded-xl text-sm font-bold transition-all duration-200 tap ${
                isSelected
                  ? "bg-mint-500 text-white shadow-cta"
                  : available
                    ? "border border-cream-300 bg-white text-ink hover:border-mint-400 hover:text-mint-600"
                    : "bg-cream-100 text-ink-faint/60 line-through"
              }`}
              aria-pressed={isSelected}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- 6. 예약 확인 ------------------------------- */

export function ConfirmStep({
  draft,
  setDraft,
  pets,
  onEdit,
}: StepProps & { pets: Pet[]; onEdit: (step: number) => void }) {
  const pet = pets.find((p) => p.id === draft.petId);
  const service = getServiceById(draft.serviceId);
  const salon = getSalonById(draft.salonId);
  const groomer = getGroomerById(draft.groomerId);

  return (
    <div className="space-y-4">
      {/* 항목마다 '변경'으로 해당 단계에 바로 돌아간다 */}
      <div className="divide-y divide-cream-200 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
        <ConfirmRow label="반려동물" onEdit={() => onEdit(0)}>
          {pet && (
            <span className="flex min-w-0 items-center gap-2.5">
              <PetAvatar pet={pet} size="sm" />
              <span className="truncate">
                {pet.name}
                <span className="font-normal text-ink-muted"> · {pet.breed}</span>
              </span>
            </span>
          )}
        </ConfirmRow>
        <ConfirmRow label="서비스" onEdit={() => onEdit(1)}>
          {service?.name}
          <span className="font-normal text-ink-muted"> · 약 {service?.durationMin}분</span>
        </ConfirmRow>
        <ConfirmRow label="미용실" onEdit={() => onEdit(2)}>
          {salon?.name}
        </ConfirmRow>
        <ConfirmRow label="미용사" onEdit={() => onEdit(3)}>
          {groomer?.name}
        </ConfirmRow>
        <ConfirmRow label="일시" onEdit={() => onEdit(4)}>
          {draft.date && `${formatDateKo(draft.date)} ${draft.time ?? ""}`}
        </ConfirmRow>
      </div>

      {/* 데스크톱은 오른쪽 요약에서 결제 금액을 보여준다 */}
      <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card lg:hidden">
        <PriceSummary draft={draft} onToggleCoupon={(useCoupon) => setDraft({ useCoupon })} />
      </div>

      <p className="px-1 text-sm leading-relaxed text-ink-muted">
        예약 10분 전까지 도착해주세요. 변경·취소는 예약 내역에서 할 수 있어요.
        <br />
        <span className="text-ink-faint">데모 서비스라 실제 결제는 이뤄지지 않아요.</span>
      </p>
    </div>
  );
}

function ConfirmRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[3.75rem] items-center gap-3 px-4 py-3 md:px-5">
      <span className="w-16 shrink-0 text-sm text-ink-muted">{label}</span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{children}</span>
      <button
        type="button"
        onClick={onEdit}
        className="-mr-2 shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold text-mint-600 transition-colors hover:bg-mint-50"
        aria-label={`${label} 변경`}
      >
        변경
      </button>
    </div>
  );
}

function SelectCircle({ selected }: { selected: boolean }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        selected
          ? "border-mint-500 bg-mint-500 text-white"
          : "border-cream-300 bg-white text-transparent"
      }`}
      aria-hidden
    >
      <Check className="h-4 w-4" strokeWidth={3} />
    </span>
  );
}
