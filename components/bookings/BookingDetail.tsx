"use client";

import {
  CalendarClock,
  CalendarPlus,
  Check,
  ChevronRight,
  Navigation,
  PenLine,
  RotateCcw,
  Ticket,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import PetAvatar from "@/components/ui/PetAvatar";
import { StarRow } from "@/components/ui/Stars";
import { useBookingDraft } from "@/lib/booking-context";
import { REBOOK_STEP, rebookDraft } from "@/lib/booking-rules";
import { COUPONS, getGroomerById, getSalonById, getSeedReviews, getServiceById } from "@/lib/data";
import { useDb } from "@/lib/db";
import { formatDateKo, formatDateShortKo, formatWon } from "@/lib/format";
import { buildIcs } from "@/lib/ics";
import {
  bookingStage,
  canModify,
  daysUntil,
  endTimeOf,
  nextGroomingDate,
  VISIT_CHECKLIST,
  type BookingStage,
} from "@/lib/lifecycle";
import { mapUrl } from "@/lib/salon-info";
import type { Booking, Review } from "@/lib/types";
import { useNow } from "@/lib/use-now";
import { CancelSheet, RescheduleSheet, ReviewSheet } from "./BookingSheets";

export const STAGE_LABEL: Record<BookingStage, string> = {
  upcoming: "예약 확정",
  tomorrow: "내일 방문",
  today: "오늘 방문",
  done: "이용 완료",
  cancelled: "취소됨",
};

export const STAGE_STYLE: Record<BookingStage, string> = {
  upcoming: "bg-mint-100 text-mint-800",
  tomorrow: "bg-mint-500 text-white",
  today: "bg-coral-600 text-white",
  done: "bg-cream-200 text-ink-soft",
  cancelled: "bg-cream-200 text-ink-muted",
};

/** 예약에 달린 내 후기 (방금 쓴 후기 + 샘플 계정의 기존 후기) */
export function useMyReview(bookingId: string): Review | undefined {
  const { reviews } = useDb();
  const now = useNow();
  return (
    reviews.find((r) => r.bookingId === bookingId) ??
    (now ? getSeedReviews(now).find((r) => r.bookingId === bookingId) : undefined)
  );
}

function downloadIcs(booking: Booking) {
  const salon = getSalonById(booking.salonId);
  const service = getServiceById(booking.serviceId);
  const groomer = getGroomerById(booking.groomerId);
  const ics = buildIcs(booking, {
    title: `${service?.name} · ${salon?.name}`,
    location: salon?.address ?? "",
    description: `${groomer?.name} 미용사 · 예약 10분 전까지 도착해주세요`,
    endTime: endTimeOf(booking),
  });
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawbeauty-${booking.bookingNo}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 예약 상세 — 예약 이후의 흐름(방문 전 안내 → 방문 → 이용 완료 → 후기 → 다시 예약)을
 * 지금 단계에 맞춰 보여주고, 다음에 할 일을 가장 위에 둔다.
 */
export default function BookingDetail({
  booking,
  embedded = false,
}: {
  booking: Booking;
  /** 예약 완료 화면처럼 위에 다른 제목이 있을 때 — 일시를 h2로 */
  embedded?: boolean;
}) {
  const router = useRouter();
  const { pets } = useDb();
  const { setDraft } = useBookingDraft();
  const now = useNow();
  const myReview = useMyReview(booking.id);
  const [sheet, setSheet] = useState<"cancel" | "reschedule" | "review" | null>(null);

  const pet = pets.find((p) => p.id === booking.petId);
  const petName = pet?.name ?? "반려동물";
  const service = getServiceById(booking.serviceId);
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);
  const coupon = COUPONS.find((c) => c.id === booking.couponId);
  const stage = now ? bookingStage(booking, now) : null;
  const modifiable = now ? canModify(booking, now) : false;
  const days = now ? daysUntil(booking.date, now) : null;
  const endTime = endTimeOf(booking);
  const active = stage === "upcoming" || stage === "tomorrow" || stage === "today";

  const rebook = () => {
    setDraft(rebookDraft(booking));
    router.push(`/booking?step=${REBOOK_STEP}`);
  };

  if (!stage || !now) {
    return <div className="skeleton h-[28rem] rounded-3xl" aria-hidden />;
  }

  return (
    <div className="space-y-6">
      {/* 머리말 — 상태와 일시 (예약 완료 화면에서는 위의 성공 안내가 대신한다) */}
      {!embedded && (
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${STAGE_STYLE[stage]}`}>
              {STAGE_LABEL[stage]}
            </span>
            {stage === "upcoming" && days !== null && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-sm font-bold text-white">
                D-{days}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {formatDateKo(booking.date)} {booking.time}
          </h1>
          <p className="mt-1 text-base text-ink-soft">
            {petName} · {service?.name} · {endTime}쯤 끝나요
          </p>
          {booking.previous && booking.status !== "cancelled" && (
            <p className="mt-1 text-sm text-ink-muted">
              {formatDateShortKo(booking.previous.date)} {booking.previous.time}에서 변경된
              예약이에요
            </p>
          )}
        </header>
      )}

      {/* 지금 할 일 */}
      <NextAction
        stage={stage}
        petName={petName}
        booking={booking}
        hasReview={Boolean(myReview) || Boolean(booking.reviewed)}
        onReview={() => setSheet("review")}
        onRebook={rebook}
        salonNotices={salon?.notices ?? []}
        endTime={endTime}
      />

      {/* 매장·미용사 */}
      <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200">
        {salon && (
          <Link
            href={`/salons/${salon.id}`}
            className="flex items-center gap-3.5 p-4 transition-colors hover:bg-cream-50"
          >
            <span
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br ${salon.gradient}`}
            >
              <Image src={salon.image} alt="" fill sizes="56px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-ink">{salon.name}</span>
              <span className="block truncate text-sm text-ink-muted">{salon.address}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
          </Link>
        )}
        <div className="flex items-center gap-3.5 border-t border-cream-200 p-4">
          {groomer && <GroomerAvatar groomer={groomer} size="md" />}
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-ink">{groomer?.name} 미용사</p>
            <p className="truncate text-sm text-ink-muted">{groomer?.specialties.join(", ")}</p>
          </div>
        </div>
        {pet && (
          <div className="flex items-center gap-3.5 border-t border-cream-200 p-4">
            <PetAvatar pet={pet} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-ink">{pet.name}</p>
              <p className="truncate text-sm text-ink-muted">
                {pet.breed} · {pet.age}살 · {pet.weight}kg
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 요청사항 */}
      {(booking.request || pet?.note) && (
        <DetailSection title="미용사에게 전달한 내용">
          {booking.request && booking.request.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {booking.request.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full bg-cream-200 px-3 py-1 text-sm font-semibold text-ink-soft"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
          {booking.request?.memo && (
            <p className="mt-2 text-base text-ink-soft">“{booking.request.memo}”</p>
          )}
          {pet?.note && <p className="mt-2 text-sm text-ink-muted">특이사항 · {pet.note}</p>}
        </DetailSection>
      )}

      {/* 결제 */}
      <DetailSection title="결제 정보">
        <dl className="space-y-2 text-sm">
          <Row label="서비스 금액" value={formatWon(booking.price)} />
          {booking.discount > 0 && (
            <Row
              label={
                <span className="flex items-center gap-1.5 text-coral-600">
                  <Ticket className="h-4 w-4" aria-hidden />
                  {coupon?.name ?? "할인"}
                </span>
              }
              value={
                <span className="text-coral-600">
                  - {booking.discount.toLocaleString("ko-KR")}원
                </span>
              }
            />
          )}
          <div className="flex items-center justify-between border-t border-cream-200 pt-2.5">
            <dt className="font-bold text-ink">
              {booking.status === "cancelled" ? "취소된 금액" : "결제 금액"}
            </dt>
            <dd className="text-lg font-extrabold text-ink">{formatWon(booking.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink-muted">예약번호 {booking.bookingNo}</p>
      </DetailSection>

      {/* 진행 상황 */}
      <DetailSection title="진행 상황">
        <Timeline
          booking={booking}
          stage={stage}
          reviewed={Boolean(myReview) || Boolean(booking.reviewed)}
        />
      </DetailSection>

      {/* 내 후기 */}
      {myReview && (
        <DetailSection title="내가 남긴 후기">
          <StarRow rating={myReview.rating} />
          {myReview.keywords && myReview.keywords.length > 0 && (
            <p className="mt-2 text-sm font-semibold text-mint-800">
              {myReview.keywords.join(" · ")}
            </p>
          )}
          {myReview.content && (
            <p className="mt-1.5 whitespace-pre-line break-words text-base leading-relaxed text-ink-soft">
              {myReview.content}
            </p>
          )}
        </DetailSection>
      )}

      {/* 예약 관리 */}
      {active && (
        <div className="grid grid-cols-2 gap-2.5">
          {modifiable ? (
            <>
              <ActionButton
                icon={<CalendarClock className="h-4 w-4" />}
                onClick={() => setSheet("reschedule")}
              >
                일정 변경
              </ActionButton>
              <ActionButton
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => setSheet("cancel")}
                tone="danger"
              >
                예약 취소
              </ActionButton>
            </>
          ) : (
            <p className="col-span-2 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-ink-muted">
              방문 당일에는 앱에서 변경·취소할 수 없어요. 매장에 직접 연락해주세요.
            </p>
          )}
          <ActionButton
            icon={<CalendarPlus className="h-4 w-4" />}
            onClick={() => downloadIcs(booking)}
          >
            캘린더에 추가
          </ActionButton>
          {salon && (
            <a
              href={mapUrl(salon.name, salon.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:ring-mint-400 tap"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              길찾기
              <span className="sr-only">(새 창)</span>
            </a>
          )}
        </div>
      )}

      {sheet === "cancel" && <CancelSheet booking={booking} onClose={() => setSheet(null)} />}
      {sheet === "reschedule" && (
        <RescheduleSheet booking={booking} onClose={() => setSheet(null)} />
      )}
      {sheet === "review" && (
        <ReviewSheet booking={booking} petName={petName} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

/** 지금 단계에서 가장 먼저 할 일 하나 */
function NextAction({
  stage,
  petName,
  booking,
  hasReview,
  onReview,
  onRebook,
  salonNotices,
  endTime,
}: {
  stage: BookingStage;
  petName: string;
  booking: Booking;
  hasReview: boolean;
  onReview: () => void;
  onRebook: () => void;
  salonNotices: string[];
  endTime: string;
}) {
  if (stage === "upcoming" || stage === "tomorrow" || stage === "today") {
    return (
      <section className="rounded-3xl bg-mint-50 p-5" aria-labelledby="prep-title">
        <h2 id="prep-title" className="text-base font-extrabold text-mint-900">
          {stage === "today"
            ? `오늘 ${booking.time} 방문이에요`
            : stage === "tomorrow"
              ? "내일 방문 전에 확인해주세요"
              : "방문 전 준비"}
        </h2>
        <ul className="mt-3 space-y-2">
          {[...VISIT_CHECKLIST, ...salonNotices.slice(0, 1)].map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-mint-600"
                strokeWidth={3}
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-semibold text-mint-800">픽업은 {endTime}쯤 오시면 돼요</p>
      </section>
    );
  }

  if (stage === "done") {
    const next = nextGroomingDate(booking);
    return (
      <section className="rounded-3xl bg-mint-50 p-5">
        <h2 className="text-base font-extrabold text-mint-900">
          {hasReview
            ? `${petName}의 다음 미용은 ${formatDateShortKo(next)}쯤이 좋아요`
            : `${petName}의 미용은 어땠나요?`}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          {hasReview
            ? `${getServiceById(booking.serviceId)?.name} 권장 주기를 기준으로 계산했어요.`
            : "후기를 남기면 다른 보호자가 미용실을 고를 때 큰 도움이 돼요."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!hasReview && (
            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
            >
              <PenLine className="h-4 w-4" aria-hidden />
              후기 작성
            </button>
          )}
          <button
            type="button"
            onClick={onRebook}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors tap ${
              hasReview
                ? "bg-mint-500 text-white shadow-cta hover:bg-mint-600"
                : "bg-white text-ink-soft ring-1 ring-cream-300 hover:ring-mint-400"
            }`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            같은 조건으로 다시 예약
          </button>
        </div>
      </section>
    );
  }

  // 취소됨
  return (
    <section className="rounded-3xl bg-cream-100 p-5">
      <h2 className="text-base font-extrabold text-ink">취소된 예약이에요</h2>
      <p className="mt-1 text-sm text-ink-muted">
        같은 미용실·미용사로 날짜만 다시 고를 수 있어요.
      </p>
      <button
        type="button"
        onClick={onRebook}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        같은 조건으로 다시 예약
      </button>
    </section>
  );
}

function Timeline({
  booking,
  stage,
  reviewed,
}: {
  booking: Booking;
  stage: BookingStage;
  reviewed: boolean;
}) {
  const created = new Date(booking.createdAt);
  const createdLabel = `${created.getMonth() + 1}월 ${created.getDate()}일`;
  const steps: { label: string; detail?: string }[] =
    stage === "cancelled"
      ? [
          { label: "예약 확정", detail: createdLabel },
          {
            label: "예약 취소",
            detail: booking.cancelledAt
              ? `${new Date(booking.cancelledAt).getMonth() + 1}월 ${new Date(booking.cancelledAt).getDate()}일`
              : undefined,
          },
        ]
      : [
          { label: "예약 확정", detail: createdLabel },
          { label: "방문 전 안내", detail: "방문 하루 전" },
          { label: "방문", detail: `${formatDateShortKo(booking.date)} ${booking.time}` },
          { label: "이용 완료", detail: `${endTimeOf(booking)}쯤` },
          { label: "후기", detail: reviewed ? "작성 완료" : undefined },
        ];
  // 끝난 단계 수
  const doneCount =
    stage === "cancelled"
      ? 2
      : { upcoming: 1, tomorrow: 2, today: 2, done: reviewed ? 5 : 4, cancelled: 2 }[stage];

  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const done = i < doneCount;
        const current = i === doneCount;
        return (
          <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && (
              <span
                className={`absolute left-[0.6875rem] top-6 h-[calc(100%-1rem)] w-0.5 ${
                  done ? "bg-mint-400" : "bg-cream-300"
                }`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                done
                  ? stage === "cancelled" && i === 1
                    ? "bg-ink-faint text-white"
                    : "bg-mint-500 text-white"
                  : current
                    ? "border-2 border-mint-500 bg-white"
                    : "border-2 border-cream-300 bg-white"
              }`}
              aria-hidden
            >
              {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <p className="min-w-0 text-sm">
              <span className={`font-bold ${done || current ? "text-ink" : "text-ink-muted"}`}>
                {step.label}
              </span>
              {step.detail && <span className="ml-2 text-ink-muted">{step.detail}</span>}
              <span className="sr-only">{done ? " (완료)" : current ? " (다음 단계)" : ""}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-cream-200">
      <h2 className="mb-3 text-base font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  children,
  tone = "default",
}: {
  icon: ReactNode;
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-white text-sm font-bold ring-1 ring-cream-300 transition-colors tap ${
        tone === "danger"
          ? "text-coral-700 hover:ring-coral-300"
          : "text-ink-soft hover:ring-mint-400"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
