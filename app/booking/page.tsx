"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import StepIndicator, {
  BOOKING_STEPS,
} from "@/components/booking/StepIndicator";
import SelectionTrail from "@/components/booking/SelectionTrail";
import SummaryCard, { computePrice } from "@/components/booking/SummaryCard";
import {
  ConfirmStep,
  DateTimeStep,
  GroomerStep,
  PetStep,
  SalonStep,
  ServiceStep,
} from "@/components/booking/steps";
import { useBookingDraft, type BookingDraft } from "@/lib/booking-context";
import { getMaxStep, isServiceForPet } from "@/lib/booking-rules";
import { getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { addBooking, useDb } from "@/lib/db";
import { formatWon, toDateKey } from "@/lib/format";
import { isSlotBookable } from "@/lib/slots";
import { useToast } from "@/lib/toast";

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingSkeleton />}>
      <BookingFlow />
    </Suspense>
  );
}

function BookingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="skeleton h-10 w-2/3 rounded-full" />
      <div className="mt-6 space-y-3">
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-24 rounded-3xl" />
        <div className="skeleton h-24 rounded-3xl" />
      </div>
    </div>
  );
}

function BookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, ready, setDraft, resetDraft } = useBookingDraft();
  const db = useDb();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  // 상태 반영 전에 들어오는 연속 클릭까지 막기 위한 동기 잠금
  const submitLock = useRef(false);
  const appliedPreset = useRef(false);
  // 프리셋 반영 전 단계로 한 프레임 그려졌다가 넘어가는 깜빡임 방지
  const [presetReady, setPresetReady] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    []
  );

  // 홈/미용실/미용사/반려동물 카드에서 넘어온 사전 선택값 적용
  useEffect(() => {
    if (!ready || !db.hydrated || appliedPreset.current) return;
    appliedPreset.current = true;
    const patch: Partial<BookingDraft> = {};

    const presetPet = db.pets.find((p) => p.id === searchParams.get("pet"));
    if (presetPet) {
      patch.petId = presetPet.id;
      const current = getServiceById(draft.serviceId);
      if (current && !isServiceForPet(current, presetPet)) patch.serviceId = null;
    }
    const salonParam = searchParams.get("salon");
    const serviceParam = searchParams.get("service");
    const groomer = getGroomerById(searchParams.get("groomer"));

    if (salonParam && getSalonById(salonParam)) {
      patch.salonId = salonParam;
      // 다른 미용실로 바뀌면 이전 미용실의 미용사·시간은 무효
      if (salonParam !== draft.salonId) {
        patch.groomerId = null;
        patch.time = null;
      }
      if (groomer && groomer.salonId === salonParam) {
        if (groomer.id !== draft.groomerId) patch.time = null;
        patch.groomerId = groomer.id;
      }
    }

    const service = getServiceById(serviceParam);
    if (service) {
      patch.serviceId = service.id;
      // 선택돼 있던 아이가 받을 수 없는 서비스라면 아이를 다시 고르게 한다
      const pet = presetPet ?? db.pets.find((p) => p.id === draft.petId);
      if (pet && !isServiceForPet(service, pet)) {
        if (presetPet) delete patch.serviceId;
        else patch.petId = null;
      }
    }

    if (Object.keys(patch).length > 0) setDraft(patch);
    setPresetReady(true);
  }, [ready, db.hydrated, db.pets, searchParams, setDraft, draft.salonId, draft.groomerId, draft.petId, draft.serviceId]);

  // 선택값이 서로 맞는지를 기준으로 진입 가능한 최대 단계
  const maxStep = useMemo(() => getMaxStep(draft, db.pets), [draft, db.pets]);

  const requested = Number(searchParams.get("step") ?? "0");
  const step = Math.min(
    Number.isFinite(requested) ? Math.max(0, Math.floor(requested)) : 0,
    maxStep
  );

  const goTo = (next: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    router.push(`/booking?step=${next}`, { scroll: true });
  };

  // 하나만 고르는 단계(반려동물·서비스·미용실·미용사)는 선택하면 잠깐 선택 표시를 보여준 뒤 다음으로 넘어간다
  const advanceFrom = (from: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => goTo(from + 1), 260);
  };

  const canProceed = step === BOOKING_STEPS.length - 1 || maxStep > step;

  const petName = db.pets.find((p) => p.id === draft.petId)?.name;
  const STEP_TITLES = [
    "어떤 아이가 미용을 받나요?",
    petName ? `${petName}에게 어떤 관리가 필요할까요?` : "어떤 관리가 필요할까요?",
    "어느 미용실이 좋을까요?",
    "누구에게 맡길까요?",
    "언제 방문할까요?",
    "예약 내용을 확인해주세요",
  ];

  const { total } = computePrice(draft);
  const isLast = step === BOOKING_STEPS.length - 1;

  const handleNext = () => {
    if (!canProceed || submitLock.current) return;
    if (!isLast) {
      goTo(step + 1);
      return;
    }
    // 예약 확정 (데모 결제)
    if (
      !draft.petId ||
      !draft.serviceId ||
      !draft.salonId ||
      !draft.groomerId ||
      !draft.date ||
      !draft.time
    ) {
      return;
    }

    // 확정 직전 재검증 — 그 사이 지나간 시간, 오래된 선택값, 이미 잡힌 시간 차단
    const now = new Date();
    if (!isSlotBookable(draft.date, draft.time, draft.groomerId, db.bookings, now)) {
      setDraft(draft.date < toDateKey(now) ? { date: null, time: null } : { time: null });
      toast("선택한 시간은 지금 예약할 수 없어요. 다른 시간을 골라주세요.", "error");
      goTo(4);
      return;
    }

    submitLock.current = true;
    setSubmitting(true);
    const { price, discount, total: finalTotal } = computePrice(draft);
    const payload = {
      petId: draft.petId,
      serviceId: draft.serviceId,
      salonId: draft.salonId,
      groomerId: draft.groomerId,
      date: draft.date,
      time: draft.time,
      price,
      discount,
      total: finalTotal,
    };
    // 실제 결제 대신 짧은 지연으로 처리감을 준다
    setTimeout(() => {
      const booking = addBooking(payload);
      resetDraft();
      toast("예약이 완료되었습니다! 🎉");
      router.push(`/booking/complete/${booking.id}`);
    }, 700);
  };

  // 저장된 선택값·반려동물 목록을 읽기 전에는 단계를 판단하지 않는다 (새로고침 시 1단계 깜빡임 방지)
  if (!ready || !db.hydrated || !presetReady) return <BookingSkeleton />;

  const onChosen = () => advanceFrom(step);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-5 md:px-6 md:pt-8 lg:pb-16">
      <StepIndicator current={step} onJump={goTo} />

      <div className="mt-5 grid gap-6 md:mt-7 lg:grid-cols-[1fr_21rem] lg:items-start">
        <section key={step} className="min-w-0 animate-fade-in-up">
          <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
            {STEP_TITLES[step]}
          </h1>
          {/* 모바일에는 요약 카드가 없으므로, 지금까지 고른 것을 한 줄로 보여주고 눌러서 바로 고칠 수 있게 한다 */}
          {step > 0 && step < 5 && (
            <SelectionTrail draft={draft} pets={db.pets} upTo={step} onJump={goTo} />
          )}

          <div className="mt-5">
            {step === 0 && (
              <PetStep
                draft={draft}
                setDraft={setDraft}
                pets={db.pets}
                hydrated={db.hydrated}
                onChosen={onChosen}
              />
            )}
            {step === 1 && (
              <ServiceStep
                draft={draft}
                setDraft={setDraft}
                pets={db.pets}
                onChosen={onChosen}
              />
            )}
            {step === 2 && (
              <SalonStep draft={draft} setDraft={setDraft} onChosen={onChosen} />
            )}
            {step === 3 && (
              <GroomerStep draft={draft} setDraft={setDraft} onChosen={onChosen} />
            )}
            {step === 4 && (
              <DateTimeStep
                draft={draft}
                setDraft={setDraft}
                bookings={db.bookings}
              />
            )}
            {step === 5 && (
              <ConfirmStep
                draft={draft}
                setDraft={setDraft}
                pets={db.pets}
                onEdit={goTo}
              />
            )}
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="mt-8 hidden items-center justify-between lg:flex">
            <button
              type="button"
              onClick={() => (step === 0 ? router.push("/") : goTo(step - 1))}
              className="flex items-center gap-1.5 rounded-2xl border border-cream-300 bg-white px-6 py-3.5 text-sm font-bold text-ink-soft transition-colors hover:bg-cream-100 tap"
            >
              <ArrowLeft className="h-4 w-4" />
              이전
            </button>
            <NextButton
              isLast={isLast}
              disabled={!canProceed}
              submitting={submitting}
              onClick={handleNext}
            />
          </div>
        </section>

        {/* 데스크톱 예약 요약 */}
        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <SummaryCard
            draft={draft}
            pets={db.pets}
            onToggleCoupon={isLast ? (useCoupon) => setDraft({ useCoupon }) : undefined}
          />
        </aside>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 shadow-float backdrop-blur-md safe-bottom lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => (step === 0 ? router.push("/") : goTo(step - 1))}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cream-300 bg-white text-ink-soft tap"
            aria-label="이전 단계"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {/* 금액이 남는 폭을 쓰고, 버튼은 한 줄로 고정한다 */}
          <div className="min-w-0 flex-1">
            {draft.serviceId && (
              <>
                <p className="whitespace-nowrap text-xs font-semibold text-ink-faint">
                  예상 결제 금액
                </p>
                <p className="truncate text-lg font-extrabold text-ink">
                  {formatWon(total)}
                </p>
              </>
            )}
          </div>
          <NextButton
            isLast={isLast}
            disabled={!canProceed}
            submitting={submitting}
            onClick={handleNext}
            mobile
          />
        </div>
      </div>
    </div>
  );
}

function NextButton({
  isLast,
  disabled,
  submitting,
  onClick,
  mobile = false,
}: {
  isLast: boolean;
  disabled: boolean;
  submitting: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  const label = isLast ? "예약 확정하기" : "다음";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || submitting}
      className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl text-base font-bold text-white transition-all duration-200 tap ${
        isLast
          ? "bg-coral-500 shadow-[0_6px_16px_rgba(233,106,71,0.3)] hover:bg-coral-600"
          : "bg-mint-500 shadow-cta hover:bg-mint-600"
      } ${mobile ? "h-12 px-5" : "px-8 py-3.5"} disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`}
    >
      {submitting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {mobile ? "처리 중…" : "예약 처리 중…"}
        </>
      ) : (
        <>
          {label}
          {!isLast && <ArrowRight className="h-4 w-4" />}
        </>
      )}
    </button>
  );
}
