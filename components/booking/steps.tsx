"use client";

import {
  BadgeCheck,
  Check,
  Clock,
  Info,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Calendar from "@/components/booking/Calendar";
import SummaryCard from "@/components/booking/SummaryCard";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import PetAvatar from "@/components/ui/PetAvatar";
import { RatingBadge } from "@/components/ui/Stars";
import type { BookingDraft } from "@/lib/booking-context";
import { getGroomersBySalon, SALONS, SERVICES } from "@/lib/data";
import { formatWon, formatDateShortKo } from "@/lib/format";
import { getSlots } from "@/lib/slots";
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
}: StepProps & { pets: Pet[]; hydrated: boolean }) {
  if (!hydrated) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-24 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pets.map((pet) => {
        const selected = draft.petId === pet.id;
        return (
          <button
            key={pet.id}
            type="button"
            onClick={() => setDraft({ petId: pet.id })}
            className={`flex w-full items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-card transition-all duration-200 tap ${
              selected
                ? "border-mint-500 bg-mint-50/60"
                : "border-transparent hover:border-mint-200"
            }`}
            aria-pressed={selected}
          >
            <PetAvatar pet={pet} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink">{pet.name}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {pet.breed} ({pet.age}살) · {pet.weight}kg
              </p>
              {pet.note && (
                <p className="mt-1 truncate text-xs text-ink-faint">{pet.note}</p>
              )}
            </div>
            <SelectCircle selected={selected} />
          </button>
        );
      })}
      <Link
        href="/pets"
        className="flex w-full items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-cream-300 bg-white/60 p-4 text-sm font-bold text-ink-muted transition-colors hover:border-mint-300 hover:text-mint-600 tap"
      >
        <Plus className="h-4 w-4" />새 반려동물 등록하기
      </Link>
    </div>
  );
}

/* -------------------------------- 2. 서비스 --------------------------------- */

export function ServiceStep({ draft, setDraft }: StepProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SERVICES.map((service) => {
        const selected = draft.serviceId === service.id;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => setDraft({ serviceId: service.id })}
            className={`relative flex flex-col rounded-3xl border-2 bg-white p-5 text-left shadow-card transition-all duration-200 tap ${
              selected
                ? "border-mint-500 bg-mint-50/60"
                : "border-transparent hover:border-mint-200"
            }`}
            aria-pressed={selected}
          >
            {service.popular && (
              <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-coral-100 px-2.5 py-1 text-xs font-bold text-coral-600">
                <Sparkles className="h-3 w-3" />
                인기
              </span>
            )}
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-50 text-3xl">
              {service.emoji}
            </span>
            <p className="mt-3 text-base font-bold text-ink">{service.name}</p>
            <p className="mt-0.5 text-sm font-medium text-mint-600">
              {service.shortDesc}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              {service.desc}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-extrabold text-ink">
                {formatWon(service.price)}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-faint">
                <Clock className="h-3.5 w-3.5" />약 {service.durationMin}분
              </span>
            </div>
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

export function SalonStep({ draft, setDraft }: StepProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SALONS.map((salon) => {
        const selected = draft.salonId === salon.id;
        return (
          <button
            key={salon.id}
            type="button"
            onClick={() =>
              setDraft({
                salonId: salon.id,
                // 미용실이 바뀌면 미용사·시간 선택 초기화
                ...(draft.salonId !== salon.id
                  ? { groomerId: null, time: null }
                  : {}),
              })
            }
            className={`relative overflow-hidden rounded-3xl border-2 bg-white text-left shadow-card transition-all duration-200 tap ${
              selected
                ? "border-mint-500"
                : "border-transparent hover:border-mint-200"
            }`}
            aria-pressed={selected}
          >
            <div
              className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${salon.gradient}`}
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
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold text-ink">{salon.name}</p>
                <RatingBadge rating={salon.rating} reviewCount={salon.reviewCount} />
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
              <p className="mt-2.5 text-sm text-ink-muted">
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

export function GroomerStep({ draft, setDraft }: StepProps) {
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
      <p className="text-sm text-ink-muted">
        오늘 예약 가능한 미용사를 확인해보세요.
      </p>
      {groomers.map((groomer) => {
        const selected = draft.groomerId === groomer.id;
        return (
          <button
            key={groomer.id}
            type="button"
            onClick={() =>
              setDraft({
                groomerId: groomer.id,
                ...(draft.groomerId !== groomer.id ? { time: null } : {}),
              })
            }
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
                <RatingBadge rating={groomer.rating} reviewCount={groomer.reviewCount} />
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
  useEffect(() => {
    setNow(new Date());
  }, []);

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
  const morning = slots.filter((s) => Number(s.time.slice(0, 2)) < 12);
  const afternoon = slots.filter((s) => Number(s.time.slice(0, 2)) >= 12);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-card md:p-5">
        <Calendar
          selected={draft.date}
          onSelect={(dateKey) => setDraft({ date: dateKey, time: null })}
          today={now}
        />
      </div>

      <div className="rounded-3xl border border-cream-200 bg-white p-4 shadow-card md:p-5">
        {draft.date ? (
          <>
            <p className="text-base font-bold text-ink">
              {formatDateShortKo(draft.date)}
            </p>
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
            {slots.every((s) => !s.available) && (
              <p className="mt-4 rounded-2xl bg-cream-100 p-4 text-center text-sm text-ink-muted">
                이 날은 예약이 모두 마감됐어요. 다른 날짜를 선택해주세요. 🙏
              </p>
            )}
            {draft.time && (
              <p className="mt-4 flex items-center gap-1.5 rounded-2xl bg-mint-50 px-4 py-3 text-sm font-bold text-mint-700 animate-fade-in">
                <BadgeCheck className="h-4 w-4" />
                선택한 시간: {formatDateShortKo(draft.date)} {draft.time}
              </p>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
            <span className="text-4xl">🗓️</span>
            <p className="mt-3 text-sm font-semibold text-ink-muted">
              먼저 날짜를 선택해주세요
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
}: StepProps & { pets: Pet[] }) {
  return (
    <div className="space-y-4">
      <SummaryCard
        draft={draft}
        pets={pets}
        onToggleCoupon={(useCoupon) => setDraft({ useCoupon })}
      />
      <div className="rounded-3xl bg-cream-100 p-5 text-sm leading-relaxed text-ink-muted">
        <p className="font-bold text-ink">예약 전 확인해주세요</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>예약 시간 10분 전까지 도착해주세요.</li>
          <li>미용 당일 아이의 컨디션이 좋지 않다면 미리 알려주세요.</li>
          <li>예약 변경·취소는 예약 내역에서 가능해요.</li>
          <li>본 MVP에서는 실제 결제 없이 데모로 예약이 확정돼요.</li>
        </ul>
      </div>
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
