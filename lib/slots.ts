import {
  getGroomerById,
  getGroomersBySalon,
  getSalonById,
  getServiceById,
  LUNCH_HOUR,
  parseOpenHours,
} from "./data";
import { addDays, hashString, toDateKey } from "./format";
import type { Booking, Salon } from "./types";

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

/** 당일 예약은 시작 1시간 전까지만 받는다 */
export const SAME_DAY_LEAD_MIN = 60;
const DEFAULT_DURATION = 60;

const toMin = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const toTime = (min: number) =>
  `${`${Math.floor(min / 60)}`.padStart(2, "0")}:${`${min % 60}`.padStart(2, "0")}`;

function isActive(b: Booking) {
  return b.status === "confirmed" || b.status === "pending";
}

function weekdayOf(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** 정기 휴무일인지 */
export function isClosedDay(dateKey: string, salon: Pick<Salon, "closedWeekdays">): boolean {
  return salon.closedWeekdays.includes(weekdayOf(dateKey));
}

/**
 * 매장 영업시간 안에서 시작할 수 있는 시각 (정시, 점심시간 제외).
 * 서비스가 영업 종료 전에 끝나는 시각까지만 만든다.
 */
export function startTimesFor(salon: Pick<Salon, "openHours">, durationMin = DEFAULT_DURATION) {
  const [open, close] = parseOpenHours(salon.openHours);
  const times: string[] = [];
  for (let t = Math.ceil(open / 60) * 60; t + durationMin <= close; t += 60) {
    if (t / 60 === LUNCH_HOUR) continue;
    times.push(toTime(t));
  }
  return times;
}

/**
 * 한 미용사의 하루 예약 가능 시간.
 * - 매장 영업시간·점심시간·정기 휴무를 따른다
 * - 지난 날짜, 당일 1시간 이내 시간은 막는다
 * - 같은 미용사에게 이미 잡힌 예약 시간은 막는다
 * - 같은 아이의 다른 예약과 미용 시간이 겹치면 막는다 (petBusy)
 * - 그 밖에 다른 고객 예약으로 찬 시간을 날짜·미용사별로 결정적으로 표시한다 (데모 데이터)
 */
export function getSlots(
  dateKey: string,
  groomerId: string,
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck
): SlotInfo[] {
  const groomer = getGroomerById(groomerId);
  const salon = groomer ? getSalonById(groomer.salonId) : null;
  if (!salon || isClosedDay(dateKey, salon)) return [];

  const todayKey = toDateKey(now);
  const isPastDay = dateKey < todayKey;
  const isToday = dateKey === todayKey;
  const nowMin = now.getHours() * 60 + now.getMinutes();

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
          return [
            start,
            start + (getServiceById(b.serviceId)?.durationMin ?? DEFAULT_DURATION),
          ] as const;
        })
    : [];

  const times = startTimesFor(salon, pet?.durationMin);

  return times.map((time) => {
    const start = toMin(time);
    if (isPastDay || (isToday && start - nowMin < SAME_DAY_LEAD_MIN)) {
      return { time, available: false };
    }
    if (booked.has(time)) return { time, available: false };
    if (pet) {
      const end = start + pet.durationMin;
      if (petBusy.some(([s, e]) => start < e && s < end)) {
        return { time, available: false, petBusy: true };
      }
    }
    // 다른 고객 예약으로 찬 시간 — 시간별로 결정적이라 서비스·새로고침과 무관하게 같다 (약 4~5개 중 1개)
    if (hashString(`${dateKey}:${groomerId}:${time}`) % 9 < 2) return { time, available: false };
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

export interface OpenSlot {
  date: string;
  time: string;
  groomerId: string;
}

/** 여러 미용사 중 가장 빠른 예약 가능 시간 (오늘부터 days일 안) */
export function earliestSlot(
  groomerIds: string[],
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck,
  days = 14
): OpenSlot | null {
  for (let i = 0; i < days; i += 1) {
    const date = toDateKey(addDays(now, i));
    let best: OpenSlot | null = null;
    for (const groomerId of groomerIds) {
      const slot = getSlots(date, groomerId, bookings, now, pet).find((s) => s.available);
      if (slot && (!best || slot.time < best.time)) best = { date, time: slot.time, groomerId };
    }
    if (best) return best;
  }
  return null;
}

/** 매장의 가장 빠른 예약 가능 시간 */
export function earliestSlotAtSalon(
  salonId: string,
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck
): OpenSlot | null {
  return earliestSlot(
    getGroomersBySalon(salonId).map((g) => g.id),
    bookings,
    now,
    pet
  );
}

/**
 * 고른 시간이 막혔을 때 대신 고를 만한 시간 — 같은 날 가까운 시간 순, 없으면 다음 가능 날짜.
 */
export function suggestAlternatives(
  dateKey: string,
  time: string,
  groomerId: string,
  bookings: Booking[],
  now: Date,
  pet?: PetSlotCheck,
  limit = 3
): OpenSlot[] {
  const target = toMin(time);
  const sameDay = getSlots(dateKey, groomerId, bookings, now, pet)
    .filter((s) => s.available)
    .sort((a, b) => Math.abs(toMin(a.time) - target) - Math.abs(toMin(b.time) - target))
    .slice(0, limit)
    .map((s) => ({ date: dateKey, time: s.time, groomerId }));
  if (sameDay.length > 0) return sameDay;

  // 그날이 모두 막혔으면 다음 날부터 가장 빠른 시간 하나
  const [y, m, d] = dateKey.split("-").map(Number);
  const from = new Date(y, m - 1, d + 1);
  for (let i = 0; i < 14; i += 1) {
    const date = toDateKey(addDays(from, i));
    const slot = getSlots(date, groomerId, bookings, now, pet).find((s) => s.available);
    if (slot) return [{ date, time: slot.time, groomerId }];
  }
  return [];
}

/** 하루 중 아직 예약 가능한 시간 수 — "마감 임박" 표시용 */
export function openCount(slots: SlotInfo[]): number {
  return slots.filter((s) => s.available).length;
}
