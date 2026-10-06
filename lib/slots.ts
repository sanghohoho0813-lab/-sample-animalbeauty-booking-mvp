import { getServiceById, TIME_SLOTS } from "./data";
import { hashString, toDateKey } from "./format";
import type { Booking } from "./types";

export interface SlotInfo {
  time: string;
  available: boolean;
  /** 같은 아이의 다른 예약과 시간이 겹쳐서 막힌 슬롯 */
  petBusy?: boolean;
}

/** 같은 아이가 한 시간에 두 곳에 예약되지 않도록 확인할 대상 */
export interface PetSlotCheck {
  petId: string;
  durationMin: number;
}

const toMin = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

function isActive(b: Booking) {
  return b.status === "confirmed" || b.status === "pending";
}

/**
 * 데모용 슬롯 가용성.
 * - 지난 시간은 비활성화
 * - 이미 확정된 예약(같은 미용사·날짜·시간)은 비활성화
 * - 같은 아이의 다른 예약과 미용 시간이 겹치면 비활성화
 * - 날짜+미용사 해시 기반으로 일부 슬롯을 "예약 마감"으로 표시해 실제 서비스 느낌을 낸다
 */
export function getSlots(
  dateKey: string,
  groomerId: string,
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck
): SlotInfo[] {
  const todayKey = toDateKey(now);
  const isToday = dateKey === todayKey;
  const isPastDay = dateKey < todayKey;

  const booked = new Set(
    bookings
      .filter((b) => b.groomerId === groomerId && b.date === dateKey && isActive(b))
      .map((b) => b.time)
  );

  // 이 아이의 같은 날 다른 예약 [시작, 끝) — 분 단위
  const petBusy = pet
    ? bookings
        .filter((b) => b.petId === pet.petId && b.date === dateKey && isActive(b))
        .map((b) => {
          const start = toMin(b.time);
          return [start, start + (getServiceById(b.serviceId)?.durationMin ?? 60)];
        })
    : [];

  const seed = hashString(`${dateKey}:${groomerId}`);

  return TIME_SLOTS.map((time, idx) => {
    if (isPastDay) return { time, available: false };
    if (isToday) {
      const hour = Number(time.slice(0, 2));
      if (hour <= now.getHours()) return { time, available: false };
    }
    if (booked.has(time)) return { time, available: false };
    if (pet) {
      const start = toMin(time);
      const end = start + pet.durationMin;
      if (petBusy.some(([s, e]) => start < e && s < end)) {
        return { time, available: false, petBusy: true };
      }
    }
    // 데모: 날짜별로 2개 안팎의 슬롯을 마감 처리
    const closedA = seed % TIME_SLOTS.length;
    const closedB = (seed >> 3) % TIME_SLOTS.length;
    if (idx === closedA || idx === closedB) return { time, available: false };
    return { time, available: true };
  });
}

/** 지금 이 순간 해당 슬롯을 실제로 예약할 수 있는지 (확정 직전 재검증용) */
export function isSlotBookable(
  dateKey: string,
  time: string,
  groomerId: string,
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck
): boolean {
  return getSlots(dateKey, groomerId, bookings, now, pet).some(
    (s) => s.time === time && s.available
  );
}

export function isDayFullyBooked(
  dateKey: string,
  groomerId: string,
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck
): boolean {
  return getSlots(dateKey, groomerId, bookings, now, pet).every((s) => !s.available);
}
