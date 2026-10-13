"use client";

import { Check, Star } from "lucide-react";
import { useMemo, useState } from "react";
import SlotPicker from "@/components/booking/SlotPicker";
import Sheet from "@/components/ui/Sheet";
import {
  COUPONS,
  getGroomerById,
  getSalonById,
  getServiceById,
  REVIEW_KEYWORD_OPTIONS,
} from "@/lib/data";
import { addReview, cancelBooking, rescheduleBooking, useDb } from "@/lib/db";
import { formatDateKo, formatDateShortKo } from "@/lib/format";
import { useToast } from "@/lib/toast";
import type { Booking } from "@/lib/types";
import { useNow } from "@/lib/use-now";

/* --------------------------------- 예약 취소 -------------------------------- */

export function CancelSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { toast } = useToast();
  const service = getServiceById(booking.serviceId);
  const coupon = COUPONS.find((c) => c.id === booking.couponId);

  return (
    <Sheet onClose={onClose} label="예약 취소 확인">
      <h2 className="text-lg font-extrabold text-ink">예약을 취소할까요?</h2>
      <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed text-ink-soft ring-1 ring-cream-200">
        <span className="font-semibold text-ink">
          {formatDateKo(booking.date)} {booking.time}
        </span>
        <br />
        {getSalonById(booking.salonId)?.name} · {service?.name}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink-muted">
        <li>· 방문 전날까지는 수수료 없이 취소돼요.</li>
        {coupon && !coupon.reusable && (
          <li>· 사용한 ‘{coupon.name}’ 쿠폰은 다시 쓸 수 있게 돌려드려요.</li>
        )}
        <li>· 취소한 예약은 되돌릴 수 없어요.</li>
      </ul>
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
            toast(
              cancelBooking(booking.id)
                ? "예약이 취소되었어요"
                : "이미 취소되었거나 당일이라 취소할 수 없는 예약이에요",
              "info"
            );
            onClose();
          }}
          className="flex-1 rounded-2xl bg-coral-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-coral-700 tap"
        >
          예약 취소
        </button>
      </div>
    </Sheet>
  );
}

/* --------------------------------- 일정 변경 -------------------------------- */

export function RescheduleSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { toast } = useToast();
  const { bookings, pets } = useDb();
  const now = useNow();
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const service = getServiceById(booking.serviceId);
  const groomer = getGroomerById(booking.groomerId);
  // 자기 자신은 빼고 계산해야 지금 시간도 '마감'으로 보이지 않는다
  const others = useMemo(() => bookings.filter((b) => b.id !== booking.id), [bookings, booking.id]);
  const pet = { petId: booking.petId, durationMin: service?.durationMin ?? 60 };
  const petName = pets.find((p) => p.id === booking.petId)?.name ?? "이 아이";

  const submit = () => {
    if (!date || !time) return;
    const result = rescheduleBooking(booking.id, date, time);
    if (result === "ok") {
      toast(`${formatDateShortKo(date)} ${time}로 바꿨어요`);
      onClose();
    } else if (result === "unavailable") {
      toast("방금 그 시간이 마감됐어요. 다른 시간을 골라주세요", "error");
      setTime(null);
    } else {
      toast("방문 당일이거나 이미 끝난 예약은 바꿀 수 없어요", "error");
      onClose();
    }
  };

  return (
    <Sheet onClose={onClose} label="예약 일정 변경" wide>
      <h2 className="text-lg font-extrabold text-ink">일정 변경</h2>
      <p className="mt-1 text-sm text-ink-muted">
        지금 예약 · {formatDateKo(booking.date)} {booking.time} · {groomer?.name} 미용사
      </p>
      <div className="mt-4">
        {now ? (
          <SlotPicker
            groomerId={booking.groomerId}
            bookings={others}
            now={now}
            pet={pet}
            petName={petName}
            date={date}
            time={time}
            onDate={(d) => {
              setDate(d);
              setTime(null);
            }}
            onTime={setTime}
          />
        ) : (
          <div className="skeleton h-80 rounded-3xl" />
        )}
      </div>
      <button
        type="button"
        disabled={!date || !time}
        onClick={submit}
        className="mt-4 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 disabled:opacity-40 disabled:shadow-none tap"
      >
        {date && time ? `${formatDateShortKo(date)} ${time}로 변경` : "날짜와 시간을 골라주세요"}
      </button>
    </Sheet>
  );
}

/* ----------------------------------- 후기 ----------------------------------- */

const REVIEW_MAX = 300;

export function ReviewSheet({
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const salon = getSalonById(booking.salonId);
  const groomer = getGroomerById(booking.groomerId);
  const trimmed = content.trim();
  const ready = keywords.length > 0 || trimmed.length > 0;

  const submit = () => {
    if (!ready) return;
    const saved = addReview(booking, { rating, content: trimmed, petName, keywords });
    if (saved) toast("소중한 후기가 등록되었어요");
    onClose();
  };

  return (
    <Sheet onClose={onClose} label="후기 작성" keepOnBackdrop={ready}>
      <h2 className="text-lg font-extrabold text-ink">{petName}의 미용은 어땠나요?</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {salon?.name} · {groomer?.name} 미용사 · {getServiceById(booking.serviceId)?.name}
      </p>

      <div className="mt-5 flex justify-center gap-1.5" role="radiogroup" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            onClick={() => setRating(n)}
            className="p-1 tap"
            aria-label={`별점 ${n}점`}
          >
            <Star
              className={`h-9 w-9 transition-colors ${
                n <= rating ? "fill-amber-400 text-amber-400" : "fill-cream-200 text-cream-200"
              }`}
            />
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm font-bold text-ink">어떤 점이 좋았나요?</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="좋았던 점">
        {REVIEW_KEYWORD_OPTIONS.map((k) => {
          const on = keywords.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => setKeywords(on ? keywords.filter((x) => x !== k) : [...keywords, k])}
              className={`flex min-h-10 items-center gap-1 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                on
                  ? "bg-mint-500 text-white"
                  : "bg-white text-ink-soft ring-1 ring-cream-300 hover:ring-mint-300"
              }`}
            >
              {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
              {k}
            </button>
          );
        })}
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={REVIEW_MAX}
        placeholder="한 줄이라도 남겨주시면 다른 보호자에게 큰 도움이 돼요 (선택)"
        aria-label="후기 내용"
        className="input-base mt-4 resize-none bg-white"
      />
      <p className="mt-1 text-right text-sm text-ink-muted">
        {content.length} / {REVIEW_MAX}
      </p>

      <button
        type="button"
        disabled={!ready}
        onClick={submit}
        className="mt-2 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 disabled:opacity-40 disabled:shadow-none tap"
      >
        후기 등록하기
      </button>
      {!ready && (
        <p className="mt-2 text-center text-sm text-ink-muted">
          좋았던 점을 고르거나 한 줄 남겨주세요
        </p>
      )}
    </Sheet>
  );
}
