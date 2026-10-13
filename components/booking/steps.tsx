"use client";

import { Check, Info, Plus, RotateCcw, Sparkles, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import SlotPicker from "@/components/booking/SlotPicker";
import { PriceSummary } from "@/components/booking/SummaryCard";
import SalonAvailability from "@/components/salon/SalonAvailability";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import PetAvatar from "@/components/ui/PetAvatar";
import SalonRow from "@/components/ui/SalonRow";
import type { BookingDraft } from "@/lib/booking-context";
import { isSalonForPet, isServiceForPet, petSlotCheck } from "@/lib/booking-rules";
import { couponBlocker, discountOf } from "@/lib/coupons";
import { quote } from "@/lib/checkout";
import {
  COUPONS,
  getGroomerById,
  getGroomersBySalon,
  getSalonById,
  getServiceById,
  REQUEST_OPTIONS,
  SALONS,
  SERVICES,
} from "@/lib/data";
import { countReviews, useDb } from "@/lib/db";
import { formatDateShortKo, formatWon, toDateKey } from "@/lib/format";
import { josa } from "@/lib/josa";
import { endTimeOf, petHistory } from "@/lib/lifecycle";
import { priceAt } from "@/lib/pricing";
import { slotLabel } from "@/lib/salon-info";
import { earliestSlot, isSlotBookable } from "@/lib/slots";
import { useToast } from "@/lib/toast";
import { useNow } from "@/lib/use-now";
import type { Booking, Pet } from "@/lib/types";

interface StepProps {
  draft: BookingDraft;
  setDraft: (patch: Partial<BookingDraft>) => void;
}

/** 고르는 항목 공통 모양 — 무거운 그림자 대신 얇은 테두리, 선택하면 테두리가 진해진다 */
function choiceClass(selected: boolean, disabled = false) {
  if (disabled) return "cursor-not-allowed bg-white opacity-50 ring-1 ring-cream-200";
  return selected
    ? "bg-mint-50/50 ring-2 ring-mint-500 tap"
    : "bg-white ring-1 ring-cream-200 hover:ring-mint-300 tap";
}

function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "mint" | "coral" | "solid";
  children: ReactNode;
}) {
  const cls = {
    neutral: "bg-cream-200 text-ink-muted",
    mint: "bg-mint-100 text-mint-800",
    coral: "bg-coral-100 text-coral-700",
    solid: "bg-mint-600 text-white",
  }[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------- 1. 반려동물 -------------------------------- */

export function PetStep({
  draft,
  setDraft,
  pets,
  hydrated,
  onChosen,
}: StepProps & { pets: Pet[]; hydrated: boolean; onChosen?: () => void }) {
  const { toast } = useToast();
  if (!hydrated) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-3xl" />
        ))}
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="rounded-3xl bg-white px-6 py-10 text-center ring-1 ring-cream-200">
        <p className="text-4xl" aria-hidden>
          🐶
        </p>
        <p className="mt-3 text-base font-bold text-ink">먼저 반려동물을 등록해주세요</p>
        <p className="mt-1 text-sm text-ink-muted">
          이름·견종·몸무게만 있으면 돼요. 등록하면 바로 예약을 이어갈 수 있어요.
        </p>
        <Link
          href="/pets?add=1&from=booking"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-mint-500 px-6 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
        >
          <Plus className="h-4 w-4" />
          반려동물 등록하기
        </Link>
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
                // 새로 고른 아이가 받을 수 없는 서비스·미용실이 남아 있으면 비운다
                const service = getServiceById(draft.serviceId);
                const salon = getSalonById(draft.salonId);
                setDraft({
                  petId: pet.id,
                  ...(service && !isServiceForPet(service, pet) ? { serviceId: null } : {}),
                  ...(salon && !isSalonForPet(salon, pet)
                    ? { salonId: null, groomerId: null, time: null }
                    : {}),
                });
                if (salon && !isSalonForPet(salon, pet)) {
                  toast(
                    `${josa(salon.name, "은는")} ${salon.species === "cat" ? "고양이" : "강아지"} 전용이라 미용실을 다시 골라주세요`,
                    "info"
                  );
                }
                onChosen?.();
              }}
              className={`relative flex min-w-0 flex-col items-center rounded-3xl p-2.5 pb-3.5 text-center transition-all duration-200 md:p-3 md:pb-4 ${choiceClass(selected)}`}
              aria-pressed={selected}
            >
              <PetPhoto pet={pet} />
              <p className="mt-2.5 w-full truncate text-base font-bold text-ink">{pet.name}</p>
              <p className="w-full truncate text-sm text-ink-muted">
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
        href="/pets?add=1&from=booking"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-cream-300 p-3.5 text-sm font-bold text-ink-muted transition-colors hover:border-mint-300 hover:text-mint-700 tap"
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
          alt=""
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
  bookings,
  onChosen,
  onRebook,
}: StepProps & {
  pets: Pet[];
  bookings: Booking[];
  onChosen?: () => void;
  /** 지난번과 같은 조건으로 바로 날짜 고르기 */
  onRebook: (booking: Booking) => void;
}) {
  const pet = pets.find((p) => p.id === draft.petId);
  // 미용실을 먼저 골라 들어왔다면 그 미용실 가격으로 보여준다
  const salon = getSalonById(draft.salonId);
  const history = pet ? petHistory(pet.id, bookings) : null;
  const last = history?.last;
  const lastSalon = last ? getSalonById(last.salonId) : null;
  const lastGroomer = last ? getGroomerById(last.groomerId) : null;
  // 지난번 미용실이 지금 고른 미용실과 다르면(미용실을 먼저 고르고 들어온 경우) 재예약 제안은 하지 않는다
  const canRebook = Boolean(last && (!salon || salon.id === last.salonId));

  return (
    <div className="space-y-4">
      {pet && history?.upcoming && (
        <p className="flex items-start gap-2 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <span>
            {josa(pet.name, "은는")} {formatDateShortKo(history.upcoming.date)}{" "}
            {history.upcoming.time}에 {getServiceById(history.upcoming.serviceId)?.name} 예약이 이미
            있어요.{" "}
            <Link
              href={`/bookings/${history.upcoming.id}`}
              className="font-semibold text-mint-700 underline underline-offset-2"
            >
              예약 보기
            </Link>
          </span>
        </p>
      )}

      {pet && last && canRebook && (
        <div className="flex flex-col gap-3 rounded-2xl bg-mint-50 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-mint-800">
              지난번 {pet.name} · {formatDateShortKo(last.date)}
            </p>
            <p className="mt-0.5 truncate text-base font-bold text-ink">
              {getServiceById(last.serviceId)?.name} · {lastSalon?.name} · {lastGroomer?.name}
            </p>
            {(last.request?.tags.length || last.request?.memo) && (
              <p className="mt-0.5 truncate text-sm text-ink-muted">
                요청사항 ·{" "}
                {[...(last.request?.tags ?? []), last.request?.memo].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRebook(last)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            같은 조건으로 예약
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
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
              className={`flex items-center gap-3.5 rounded-2xl p-4 text-left transition-all duration-200 ${choiceClass(selected, unavailable)}`}
              aria-pressed={selected}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint-50 text-2xl"
                aria-hidden
              >
                {service.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base font-bold text-ink">
                  {service.name}
                  {unavailable ? (
                    <Badge>{service.species === "cat" ? "고양이 전용" : "강아지 전용"}</Badge>
                  ) : last?.serviceId === service.id ? (
                    <Badge tone="mint">지난번</Badge>
                  ) : (
                    service.popular && (
                      <Badge tone="coral">
                        <Sparkles className="h-3 w-3" aria-hidden />
                        인기
                      </Badge>
                    )
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-ink-muted">{service.shortDesc}</p>
              </div>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-base font-extrabold text-ink">
                  {formatWon(priceAt(service, salon))}
                </span>
                <span className="text-sm text-ink-muted">약 {service.durationMin}분</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="flex items-start gap-1.5 text-sm text-ink-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {salon
          ? `${salon.name} 기준 가격이에요.`
          : "미용실마다 가격이 조금씩 달라요. 다음 단계에서 미용실별 가격을 비교할 수 있어요."}
      </p>
    </div>
  );
}

/* -------------------------------- 3. 미용실 --------------------------------- */

export function SalonStep({ draft, setDraft, onChosen }: StepProps & { onChosen?: () => void }) {
  const { reviews, pets, bookings } = useDb();
  const pet = pets.find((p) => p.id === draft.petId);
  const service = getServiceById(draft.serviceId);
  const check = petSlotCheck(draft);
  const visited = new Set(
    bookings
      .filter((b) => b.petId === draft.petId && b.status === "completed")
      .map((b) => b.salonId)
  );
  // 받을 수 없는 미용실(고양이 전문 등)은 맨 뒤로
  const salons = [...SALONS].sort(
    (a, b) =>
      Number(Boolean(pet && !isSalonForPet(a, pet))) -
      Number(Boolean(pet && !isSalonForPet(b, pet)))
  );

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
      {salons.map((salon) => {
        const selected = draft.salonId === salon.id;
        const unavailable = Boolean(pet && !isSalonForPet(salon, pet));
        const reviewCount = salon.reviewCount + countReviews(reviews, "salonId", salon.id);
        // 고른 서비스의 이 미용실 가격 — 미용실끼리 바로 비교할 수 있게
        const price = service
          ? { label: service.name, amount: priceAt(service, salon) }
          : { label: "기본 미용", amount: salon.priceFrom };
        return (
          <div
            key={salon.id}
            className={`relative flex items-center rounded-2xl transition-all duration-200 ${choiceClass(selected, unavailable)}`}
          >
            <button
              type="button"
              disabled={unavailable}
              onClick={() => {
                setDraft({
                  salonId: salon.id,
                  // 미용실이 바뀌면 미용사·시간 선택 초기화
                  ...(draft.salonId !== salon.id ? { groomerId: null, time: null } : {}),
                });
                onChosen?.();
              }}
              className="min-w-0 flex-1 p-3 pr-1 text-left disabled:cursor-not-allowed"
              aria-pressed={selected}
              aria-label={`${salon.name} 선택${unavailable ? ` (${salon.species === "cat" ? "고양이" : "강아지"} 전용)` : ""}`}
            >
              <SalonRow
                salon={salon}
                reviewCount={reviewCount}
                price={price}
                badge={
                  unavailable ? (
                    <Badge>{salon.species === "cat" ? "고양이 전용" : "강아지 전용"}</Badge>
                  ) : visited.has(salon.id) ? (
                    <Badge tone="solid">지난번 방문</Badge>
                  ) : null
                }
                availability={
                  unavailable ? undefined : <SalonAvailability salonId={salon.id} pet={check} />
                }
              />
            </button>
            <Link
              href={`/salons/${salon.id}`}
              className="mr-1 flex h-11 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-cream-100 hover:text-ink"
              aria-label={`${salon.name} 매장 정보 보기`}
              title="매장 정보"
            >
              <Info className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- 4. 미용사 --------------------------------- */

export function GroomerStep({ draft, setDraft, onChosen }: StepProps & { onChosen?: () => void }) {
  const { reviews, bookings } = useDb();
  const now = useNow();
  const check = petSlotCheck(draft);

  if (!draft.salonId) {
    return (
      <p className="rounded-3xl bg-cream-100 p-6 text-center text-sm text-ink-muted">
        먼저 미용실을 선택해주세요.
      </p>
    );
  }

  // 이 아이를 지난번에 맡았던 미용사를 맨 위에
  const lastGroomerId = petHistory(
    draft.petId ?? "",
    bookings.filter((b) => b.salonId === draft.salonId)
  ).last?.groomerId;
  const groomers = [...getGroomersBySalon(draft.salonId)].sort(
    (a, b) => Number(b.id === lastGroomerId) - Number(a.id === lastGroomerId)
  );

  return (
    <div className="space-y-2.5">
      {groomers.map((groomer) => {
        const selected = draft.groomerId === groomer.id;
        const slot = now ? earliestSlot([groomer.id], bookings, now, check) : null;
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
            className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all duration-200 ${choiceClass(selected)}`}
            aria-pressed={selected}
          >
            <GroomerAvatar groomer={groomer} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-base font-bold text-ink">
                {groomer.name}
                {groomer.id === lastGroomerId && <Badge tone="mint">지난번 담당</Badge>}
                {groomer.premium && <Badge tone="coral">수석</Badge>}
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">
                경력 {groomer.careerYears}년 · ★ {groomer.rating.toFixed(1)} (
                {groomer.reviewCount + countReviews(reviews, "groomerId", groomer.id)}) ·{" "}
                {groomer.specialties.join(", ")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-mint-700">
                {!now ? (
                  <span className="inline-block h-4 w-24 rounded bg-cream-200/70 align-middle" />
                ) : slot ? (
                  `${slotLabel(slot, now)}부터 가능`
                ) : (
                  <span className="text-ink-muted">2주 안 예약 마감</span>
                )}
              </p>
            </div>
            <SelectCircle selected={selected} />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ 5. 날짜/시간 -------------------------------- */

export function DateTimeStep({ draft, setDraft, bookings }: StepProps & { bookings: Booking[] }) {
  const now = useNow();
  const timesRef = useRef<HTMLDivElement>(null);
  const { pets } = useDb();
  const petName = pets.find((p) => p.id === draft.petId)?.name ?? "이 아이";
  const { petId, serviceId } = draft;
  const pet = useMemo(() => petSlotCheck({ petId, serviceId }), [petId, serviceId]);

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
      !isSlotBookable(draft.date, draft.time, draft.groomerId, bookings, now, pet)
    ) {
      setDraft({ time: null });
    }
  }, [now, draft.date, draft.time, draft.groomerId, bookings, setDraft, pet]);

  if (!now || !draft.groomerId) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-80 rounded-3xl" />
        <div className="skeleton h-28 rounded-3xl" />
      </div>
    );
  }

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
    <SlotPicker
      ref={timesRef}
      groomerId={draft.groomerId}
      bookings={bookings}
      now={now}
      pet={pet}
      petName={petName}
      date={draft.date}
      time={draft.time}
      onDate={pickDate}
      onTime={(time) => setDraft({ time })}
    />
  );
}

/* ------------------------------- 6. 예약 확인 ------------------------------- */

export function ConfirmStep({
  draft,
  setDraft,
  pets,
  bookings,
  onEdit,
}: StepProps & { pets: Pet[]; bookings: Booking[]; onEdit: (step: number) => void }) {
  const pet = pets.find((p) => p.id === draft.petId);
  const service = getServiceById(draft.serviceId);
  const salon = getSalonById(draft.salonId);
  const groomer = getGroomerById(draft.groomerId);
  const last = pet ? petHistory(pet.id, bookings).last : undefined;

  // 아이가 바뀌었으면 그 아이의 지난 요청사항으로 채운다 (처음 예약이면 빈 칸)
  useEffect(() => {
    if (!draft.petId || draft.requestPetId === draft.petId) return;
    setDraft({
      requestTags: last?.request?.tags ?? [],
      requestMemo: last?.request?.memo ?? "",
      requestPetId: draft.petId,
    });
  }, [draft.petId, draft.requestPetId, last, setDraft]);

  // 지금 요청사항이 지난번 것 그대로인지 (고치면 안내를 숨긴다)
  const prefilled =
    Boolean(last?.request) &&
    (draft.requestTags.length > 0 || draft.requestMemo !== "") &&
    draft.requestMemo === (last?.request?.memo ?? "") &&
    draft.requestTags.join("|") === (last?.request?.tags ?? []).join("|");

  return (
    <div className="space-y-6">
      {/* 항목마다 '변경'으로 해당 단계에 바로 돌아간다 */}
      <div className="divide-y divide-cream-200 overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200">
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
          <span className="block truncate">{salon?.name}</span>
        </ConfirmRow>
        <ConfirmRow label="미용사" onEdit={() => onEdit(3)}>
          {groomer?.name}
        </ConfirmRow>
        <ConfirmRow label="일시" onEdit={() => onEdit(4)}>
          {draft.date && draft.time && (
            <>
              {formatDateShortKo(draft.date)} {draft.time}
              {draft.serviceId && (
                <span className="block text-sm font-normal text-ink-muted">
                  {endTimeOf({ time: draft.time, serviceId: draft.serviceId })}쯤 끝나요
                </span>
              )}
            </>
          )}
        </ConfirmRow>
      </div>

      {/* 요청사항 — 고르기 + 짧은 메모 */}
      <section aria-labelledby="request-title">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="request-title" className="text-base font-extrabold text-ink">
            요청사항 <span className="text-sm font-semibold text-ink-muted">(선택)</span>
          </h2>
          {prefilled && <p className="text-sm text-mint-700">지난번 요청사항을 불러왔어요</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="요청사항 고르기">
          {REQUEST_OPTIONS.map((option) => {
            const on = draft.requestTags.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setDraft({
                    requestTags: on
                      ? draft.requestTags.filter((t) => t !== option)
                      : [...draft.requestTags, option],
                    requestPetId: draft.petId,
                  })
                }
                className={`flex min-h-10 items-center gap-1 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  on
                    ? "bg-mint-500 text-white"
                    : "bg-white text-ink-soft ring-1 ring-cream-300 hover:ring-mint-300"
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                {option}
              </button>
            );
          })}
        </div>
        <label className="mt-3 block">
          <span className="sr-only">미용사에게 전할 말</span>
          <input
            value={draft.requestMemo}
            onChange={(e) => setDraft({ requestMemo: e.target.value, requestPetId: draft.petId })}
            maxLength={80}
            placeholder="그 밖에 미용사에게 전할 말 (예: 곰돌이컷으로 해주세요)"
            className="input-base bg-white"
          />
        </label>
        {pet?.note && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              등록된 특이사항도 함께 전달돼요 · <span className="text-ink-soft">“{pet.note}”</span>
            </span>
          </p>
        )}
      </section>

      {/* 쿠폰 */}
      <CouponPicker draft={draft} setDraft={setDraft} bookings={bookings} />

      {/* 데스크톱은 오른쪽 요약에서 결제 금액을 보여준다 */}
      <div className="rounded-3xl bg-white p-5 ring-1 ring-cream-200 lg:hidden">
        <PriceSummary draft={draft} bookings={bookings} />
      </div>

      <p className="px-1 text-sm leading-relaxed text-ink-muted">
        일정 변경·취소는 방문 전날까지 예약 내역에서 할 수 있어요.
        <br />
        데모 서비스라 실제 결제는 이뤄지지 않아요.
      </p>
    </div>
  );
}

function CouponPicker({ draft, setDraft, bookings }: StepProps & { bookings: Booking[] }) {
  const { price, coupon: applied } = quote(draft, bookings);
  const ctx = { serviceId: draft.serviceId, salonId: draft.salonId, bookings };
  const options = COUPONS.map((c) => ({ coupon: c, blocker: couponBlocker(c, ctx) }));

  return (
    <section aria-labelledby="coupon-title">
      <h2 id="coupon-title" className="text-base font-extrabold text-ink">
        쿠폰
      </h2>
      <div
        className="mt-3 divide-y divide-cream-200 overflow-hidden rounded-2xl bg-white ring-1 ring-cream-200"
        role="radiogroup"
        aria-labelledby="coupon-title"
      >
        {options.map(({ coupon, blocker }) => {
          const checked = applied?.id === coupon.id;
          return (
            <label
              key={coupon.id}
              className={`flex min-h-14 items-center gap-3 px-4 py-3 ${
                blocker ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:bg-cream-50"
              }`}
            >
              <input
                type="radio"
                name="coupon"
                checked={checked}
                disabled={Boolean(blocker)}
                onChange={() => setDraft({ couponId: coupon.id })}
                className="h-5 w-5 shrink-0 accent-mint-500"
              />
              <Ticket className="h-5 w-5 shrink-0 text-coral-500" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{coupon.name}</span>
                <span className="block text-sm text-ink-muted">{blocker ?? coupon.desc}</span>
              </span>
              {!blocker && (
                <span className="shrink-0 text-sm font-bold text-coral-600">
                  -{discountOf(coupon, price).toLocaleString("ko-KR")}원
                </span>
              )}
            </label>
          );
        })}
        <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 hover:bg-cream-50">
          <input
            type="radio"
            name="coupon"
            checked={!applied}
            onChange={() => setDraft({ couponId: "none" })}
            className="h-5 w-5 shrink-0 accent-mint-500"
          />
          <span className="text-sm font-semibold text-ink-soft">사용 안 함</span>
        </label>
      </div>
    </section>
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
        className="-mr-2 shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold text-mint-700 transition-colors hover:bg-mint-50"
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
