import { TIME_SLOTS } from "./data";
import { hashString, toDateKey } from "./format";
import type { Booking } from "./types";

export interface SlotInfo {
  time: string;
  available: boolean;
}

/**
 * 데모용 슬롯 가용성.
 * - 지난 시간은 비활성화
 * - 이미 확정된 예약(같은 미용사·날짜·시간)은 비활성화
 * - 날짜+미용사 해시 기반으로 일부 슬롯을 "예약 마감"으로 표시해 실제 서비스 느낌을 낸다
 */
export function getSlots(
  dateKey: string,
  groomerId: string,
  bookings: Booking[],
  now: Date
): SlotInfo[] {
  const todayKey = toDateKey(now);
  const isToday = dateKey === todayKey;
  const isPastDay = dateKey < todayKey;

  const booked = new Set(
    bookings
      .filter(
        (b) =>
          b.groomerId === groomerId &&
          b.date === dateKey &&
          (b.status === "confirmed" || b.status === "pending")
      )
      .map((b) => b.time)
  );

  const seed = hashString(`${dateKey}:${groomerId}`);

  return TIME_SLOTS.map((time, idx) => {
    if (isPastDay) return { time, available: false };
    if (isToday) {
      const hour = Number(time.slice(0, 2));
      if (hour <= now.getHours()) return { time, available: false };
    }
    if (booked.has(time)) return { time, available: false };
    // 데모: 날짜별로 2개 안팎의 슬롯을 마감 처리
    const closedA = seed % TIME_SLOTS.length;
    const closedB = (seed >> 3) % TIME_SLOTS.length;
    if (idx === closedA || idx === closedB) return { time, available: false };
    return { time, available: true };
  });
}

export function isDayFullyBooked(
  dateKey: string,
  groomerId: string,
  bookings: Booking[],
  now: Date
): boolean {
  return getSlots(dateKey, groomerId, bookings, now).every((s) => !s.available);
}
