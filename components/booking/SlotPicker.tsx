"use client";

import { Check, CalendarDays, Info, Zap } from "lucide-react";
import { forwardRef } from "react";
import Calendar from "@/components/booking/Calendar";
import { getGroomerById, getSalonById } from "@/lib/data";
import { formatDateShortKo } from "@/lib/format";
import { closedDaysLabel, slotLabel } from "@/lib/salon-info";
import {
  earliestSlot,
  getSlots,
  isClosedDay,
  isDayFullyBooked,
  openCount as countOpen,
  type PetSlotCheck,
  type SlotInfo,
} from "@/lib/slots";
import type { Booking } from "@/lib/types";

/** 남은 시간이 이 개수 이하면 '마감 임박'으로 알린다 */
const FEW_LEFT = 2;

/**
 * 날짜·시간 고르기 — 예약 단계와 '일정 변경'에서 함께 쓴다.
 * 미용사의 매장 영업시간·휴무·다른 예약·같은 아이의 일정까지 반영한 시간만 열린다.
 */
const SlotPicker = forwardRef<
  HTMLDivElement,
  {
    groomerId: string;
    bookings: Booking[];
    now: Date;
    pet?: PetSlotCheck;
    petName: string;
    date: string | null;
    time: string | null;
    onDate: (date: string) => void;
    onTime: (time: string) => void;
    /** 넓은 화면에서 달력과 시간을 나란히 둘지 */
    twoColumn?: boolean;
    /** 일정 변경 중인 예약의 지금 시간 — 이 시간이 가장 빠르면 '가장 빠른 예약'을 권하지 않는다 */
    current?: { date: string; time: string };
  }
>(function SlotPicker(
  { groomerId, bookings, now, pet, petName, date, time, onDate, onTime, twoColumn = true, current },
  timesRef
) {
  const groomer = getGroomerById(groomerId);
  const salon = groomer ? getSalonById(groomer.salonId) : null;
  const slots: SlotInfo[] = date ? getSlots(date, groomerId, bookings, now, pet) : [];
  const closed = Boolean(date && salon && isClosedDay(date, salon));
  const hasPetConflict = slots.some((s) => s.petBusy);
  const open = countOpen(slots);
  const morning = slots.filter((s) => Number(s.time.slice(0, 2)) < 12);
  const afternoon = slots.filter((s) => Number(s.time.slice(0, 2)) >= 12);
  // 고민 없이 바로 잡을 수 있는 가장 빠른 시간
  const found = earliestSlot([groomerId], bookings, now, pet);
  const earliest =
    found && !(current && current.date === found.date && current.time === found.time)
      ? found
      : null;
  const earliestChosen = Boolean(earliest && earliest.date === date && earliest.time === time);
  const fewLeft = (key: string) => {
    const n = countOpen(getSlots(key, groomerId, bookings, now, pet));
    return n > 0 && n <= FEW_LEFT;
  };

  return (
    <div className={`grid gap-4 ${twoColumn ? "lg:grid-cols-2" : ""}`}>
      {earliest && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors ${twoColumn ? "lg:col-span-2" : ""} ${
            earliestChosen ? "bg-mint-50 ring-mint-300" : "bg-white ring-cream-200"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-mint-700">
            <Zap className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-ink-muted">가장 빠른 예약</span>
            <span className="block truncate text-base font-bold text-ink">
              {slotLabel(earliest, now)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              onDate(earliest.date);
              onTime(earliest.time);
            }}
            disabled={earliestChosen}
            className={`flex shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition-colors tap ${
              earliestChosen
                ? "bg-transparent text-mint-700"
                : "bg-mint-500 text-white hover:bg-mint-600"
            }`}
          >
            {earliestChosen ? (
              <>
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                선택됨
              </>
            ) : (
              "이 시간으로"
            )}
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-white p-4 ring-1 ring-cream-200 md:p-5">
        <Calendar
          selected={date}
          onSelect={onDate}
          today={now}
          isClosed={(key) => Boolean(salon && isClosedDay(key, salon))}
          isFullyBooked={(key) => isDayFullyBooked(key, groomerId, bookings, now, pet)}
          isFewLeft={fewLeft}
        />
        {salon && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ink-muted">
            <span>
              {salon.openHours} · {closedDaysLabel(salon.closedWeekdays)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-coral-500" aria-hidden />
              마감 임박
            </span>
          </p>
        )}
      </div>

      <div
        ref={timesRef}
        className={`scroll-mt-24 rounded-3xl bg-white p-4 ring-1 ring-cream-200 md:p-5 ${
          date ? "" : twoColumn ? "hidden lg:block" : "hidden"
        }`}
      >
        {date ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-base font-bold text-ink">{formatDateShortKo(date)}</p>
              {open > 0 && (
                <p
                  className={`text-sm font-semibold ${
                    open <= FEW_LEFT ? "text-coral-600" : "text-mint-600"
                  }`}
                >
                  {open <= FEW_LEFT ? `마감 임박 · ${open}자리 남음` : `${open}개 시간 가능`}
                </p>
              )}
            </div>
            {open === 0 ? (
              <p className="mt-4 rounded-2xl bg-cream-100 p-4 text-center text-sm text-ink-muted">
                {closed
                  ? "매장 정기 휴무일이에요. 다른 날짜를 골라주세요."
                  : hasPetConflict
                    ? `이 날은 ${petName}의 다른 예약과 시간이 겹쳐요. 다른 날짜를 골라주세요.`
                    : "이 날은 예약이 모두 마감됐어요. 다른 날짜를 골라주세요."}
              </p>
            ) : (
              <>
                <TimeGroup label="오전" slots={morning} selected={time} onSelect={onTime} />
                <TimeGroup label="오후" slots={afternoon} selected={time} onSelect={onTime} />
                {hasPetConflict && (
                  <p className="mt-4 flex items-start gap-1.5 text-sm text-ink-muted">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {petName}의 다른 예약과 겹치는 시간은 고를 수 없어요.
                  </p>
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
            <CalendarDays className="h-9 w-9 text-mint-300" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-ink-muted">
              날짜를 고르면 예약 가능한 시간이 보여요
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default SlotPicker;

function TimeGroup({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: SlotInfo[];
  selected: string | null;
  onSelect: (time: string) => void;
}) {
  if (slots.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-ink-muted">{label}</p>
      <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label={`${label} 시간`}>
        {slots.map(({ time, available, petBusy }) => {
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
              aria-label={
                available ? time : `${time}, ${petBusy ? "다른 예약과 겹침" : "예약 마감"}`
              }
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
