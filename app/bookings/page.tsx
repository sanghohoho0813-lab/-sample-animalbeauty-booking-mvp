"use client";

import {
  CalendarDays,
  ChevronDown,
  MapPin,
  PenLine,
  RotateCcw,
  Star,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import EmptyState from "@/components/ui/EmptyState";
import PetAvatar from "@/components/ui/PetAvatar";
import { StarRow } from "@/components/ui/Stars";
import { useBookingDraft } from "@/lib/booking-context";
import { REBOOK_STEP, rebookDraft } from "@/lib/booking-rules";
import {
  getGroomerById,
  getSalonById,
  getServiceById,
  REVIEWS,
} from "@/lib/data";
import { addReview, setBookingStatus, useDb } from "@/lib/db";
import { formatDateKo, formatWon } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Booking, BookingStatus, Pet, Review } from "@/lib/types";
import { useModal } from "@/lib/use-modal";

const REVIEW_MAX = 300;

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "확정 대기",
  confirmed: "예약 확정",
  completed: "이용 완료",
  cancelled: "취소됨",
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-mint-100 text-mint-700",
  completed: "bg-cream-200 text-ink-soft",
  cancelled: "bg-coral-100 text-coral-600",
};

type Tab = "upcoming" | "past";

export default function BookingsPage() {
  const { bookings, pets, reviews, hydrated } = useDb();
  const { setDraft } = useBookingDraft();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  // 예약별 내 후기 (방금 작성한 후기 + 샘플 계정의 기존 후기)
  const reviewByBooking = useMemo(() => {
    const map = new Map<string, Review>();
    [...REVIEWS, ...reviews].forEach((r) => {
      if (r.bookingId) map.set(r.bookingId, r);
    });
    return map;
  }, [reviews]);

  const rebook = (booking: Booking) => {
    setDraft(rebookDraft(booking));
    router.push(`/booking?step=${REBOOK_STEP}`);
  };

  const { upcoming, past } = useMemo(() => {
    const sorted = [...bookings].sort((a, b) =>
      `${a.date}${a.time}` < `${b.date}${b.time}` ? 1 : -1
    );
    return {
      upcoming: sorted
        .filter((b) => b.status === "confirmed" || b.status === "pending")
        .reverse(),
      past: sorted.filter(
        (b) => b.status === "completed" || b.status === "cancelled"
      ),
    };
  }, [bookings]);

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        예약 내역
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        예정된 예약과 지난 이용 내역을 확인하세요.
      </p>

      {/* 탭 */}
      <div className="mt-5 flex rounded-2xl bg-cream-200/70 p-1">
        {(
          [
            ["upcoming", `예정된 예약${hydrated ? ` ${upcoming.length}` : ""}`],
            ["past", `지난 내역${hydrated ? ` ${past.length}` : ""}`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
              tab === key
                ? "bg-white text-ink shadow-card"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {!hydrated &&
          [0, 1].map((i) => <div key={i} className="skeleton h-40 rounded-3xl" />)}

        {hydrated && list.length === 0 && (
          <EmptyState
            emoji={tab === "upcoming" ? "🗓️" : "🐾"}
            title={
              tab === "upcoming"
                ? "예정된 예약이 없어요"
                : "지난 이용 내역이 없어요"
            }
            desc={
              tab === "upcoming"
                ? "우리 아이를 위한 첫 미용을 예약해보세요."
                : "미용을 받고 나면 이곳에서 후기를 남길 수 있어요."
            }
            actionHref="/booking"
            actionLabel="예약하러 가기"
          />
        )}

        {hydrated &&
          list.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              pet={pets.find((p) => p.id === booking.petId)}
              myReview={reviewByBooking.get(booking.id)}
              onCancel={() => setCancelTarget(booking)}
              onReview={() => setReviewTarget(booking)}
              onRebook={() => rebook(booking)}
            />
          ))}
      </div>

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {reviewTarget && (
        <ReviewDialog
          booking={reviewTarget}
          petName={pets.find((p) => p.id === reviewTarget.petId)?.name ?? ""}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}

function BookingCard({
  booking,
  pet,
  myReview,
  onCancel,
  onReview,
  onRebook,
}: {
  booking: Booking;
  pet?: Pet;
  myReview?: Review;
  onCancel: () => void;
  onReview: () => void;
  onRebook: () => void;
}) {
  const [open, setOpen] = useState(false);
  const service = getServiceById(booking.serviceId);
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);
  const cancellable =
    booking.status === "confirmed" || booking.status === "pending";
  const isPast =
    booking.status === "completed" || booking.status === "cancelled";
  // 후기는 이용 완료된 예약에서만 쓸 수 있다
  const reviewable = booking.status === "completed" && !booking.reviewed;

  return (
    <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card animate-fade-in-up">
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[booking.status]}`}
          >
            {STATUS_LABEL[booking.status]}
          </span>
          {/* 금액을 머리줄로 올려 본문(이름·일시·미용실)이 전체 폭을 쓰게 한다 */}
          <p className="text-base font-extrabold text-ink">
            {formatWon(booking.total)}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-3.5">
          {pet && <PetAvatar pet={pet} size="md" />}
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-ink">
              {pet?.name ?? "반려동물"} · {service?.name}
            </p>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
              {formatDateKo(booking.date)} {booking.time}
            </p>
            <p className="mt-0.5 flex items-start gap-1.5 text-sm text-ink-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {salon?.name} · {groomer?.name} 미용사
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-cream-100 py-2 text-xs font-bold text-ink-muted transition-colors hover:bg-cream-200"
        >
          상세 정보
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <dl className="mt-3 space-y-2 rounded-2xl bg-cream-50 p-4 text-sm animate-fade-in">
            <DetailRow label="예약번호" value={booking.bookingNo} />
            <DetailRow label="서비스" value={`${service?.name} (${service?.shortDesc})`} />
            <DetailRow
              label="소요 시간"
              value={service ? `약 ${service.durationMin}분` : "-"}
            />
            <DetailRow label="미용실 주소" value={salon?.address ?? "-"} />
            <DetailRow label="기본 가격" value={service ? formatWon(booking.price) : "-"} />
            {booking.discount > 0 && (
              <DetailRow
                label="할인"
                value={`- ₩ ${booking.discount.toLocaleString("ko-KR")}`}
              />
            )}
            <DetailRow label="결제 금액" value={formatWon(booking.total)} bold />
          </dl>
        )}

        {booking.status === "completed" && myReview && (
          <div className="mt-3 rounded-2xl border border-cream-200 bg-cream-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-ink-soft">내가 남긴 후기</span>
              <StarRow rating={myReview.rating} />
            </div>
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-ink-soft">
              {myReview.content}
            </p>
          </div>
        )}
      </div>

      {(cancellable || isPast) && (
        <div className="flex gap-2 border-t border-cream-200 bg-cream-50/60 px-5 py-3.5">
          {cancellable && (
            <button
              type="button"
              onClick={onCancel}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-cream-300 bg-white py-2.5 text-sm font-bold text-ink-muted transition-colors hover:border-coral-300 hover:text-coral-600 tap"
            >
              예약 취소
            </button>
          )}
          {isPast && (
            <button
              type="button"
              onClick={onRebook}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream-300 bg-white py-2.5 text-sm font-bold text-ink-soft transition-colors hover:border-mint-300 hover:text-mint-700 tap"
            >
              <RotateCcw className="h-4 w-4" />
              다시 예약
            </button>
          )}
          {reviewable && (
            <button
              type="button"
              onClick={onReview}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-mint-500 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
            >
              <PenLine className="h-4 w-4" />
              후기 작성
            </button>
          )}
          {booking.status === "completed" && booking.reviewed && !myReview && (
            <span className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-cream-100 py-2.5 text-sm font-bold text-ink-faint">
              <Star className="h-4 w-4" />
              후기 작성 완료
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className={`text-right ${bold ? "font-extrabold text-ink" : "font-semibold text-ink-soft"}`}>
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------- 취소 다이얼로그 ------------------------------ */

function CancelDialog({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const service = getServiceById(booking.serviceId);

  return (
    <Overlay onClose={onClose}>
      <div className="text-center">
        <span className="text-5xl">🥺</span>
        <h2 className="mt-3 text-lg font-extrabold text-ink">
          예약을 취소할까요?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {formatDateKo(booking.date)} {booking.time} · {service?.name}
          <br />
          취소 후에는 되돌릴 수 없어요.
        </p>
      </div>
      <div className="mt-6 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-2xl border border-cream-300 bg-white py-3.5 text-sm font-bold text-ink-soft transition-colors hover:bg-cream-100 tap"
        >
          유지하기
        </button>
        <button
          type="button"
          onClick={() => {
            setBookingStatus(booking.id, "cancelled");
            toast("예약이 취소되었어요", "info");
            onClose();
          }}
          className="flex-1 rounded-2xl bg-coral-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-coral-600 tap"
        >
          예약 취소
        </button>
      </div>
    </Overlay>
  );
}

/* ------------------------------- 후기 다이얼로그 ------------------------------ */

function ReviewDialog({
  booking,
  petName,
  onClose,
}: {
  booking: Booking;
  petName: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);
  const trimmed = content.trim();

  const submit = () => {
    if (!trimmed) return;
    const saved = addReview(booking, { rating, content: trimmed, petName });
    if (saved) toast("소중한 후기가 등록되었어요 💚");
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <h2 className="text-lg font-extrabold text-ink">후기 작성</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {salon?.name} · {groomer?.name} 미용사
      </p>

      <div className="mt-5 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="p-1 tap"
            aria-label={`별점 ${n}점`}
          >
            <Star
              className={`h-9 w-9 transition-colors ${
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-cream-200 text-cream-200"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={REVIEW_MAX}
        placeholder="우리 아이의 미용은 어땠나요? 솔직한 후기를 남겨주세요."
        aria-label="후기 내용"
        className="mt-4 w-full resize-none rounded-2xl border border-cream-300 bg-cream-50 p-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-mint-400"
      />
      <p className="mt-1 text-right text-xs text-ink-faint">
        {content.length} / {REVIEW_MAX}
      </p>

      <button
        type="button"
        disabled={!trimmed}
        onClick={submit}
        className="mt-3 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 disabled:opacity-40 disabled:shadow-none tap"
      >
        후기 등록하기
      </button>
    </Overlay>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useModal(onClose);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-card-hover animate-slide-up sm:rounded-3xl sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream-100"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pt-2 safe-bottom">{children}</div>
      </div>
    </div>
  );
}
