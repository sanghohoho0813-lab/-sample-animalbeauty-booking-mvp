import { getServiceById } from "./data";
import { addDays, toDateKey } from "./format";
import type { Booking } from "./types";

/**
 * 예약 이후의 흐름: 예약 확정 → 방문 전날 → 방문 당일 → 이용 완료 → 후기 → 다시 예약.
 * 화면은 이 단계에 맞춰 다음에 할 일을 보여준다.
 */
export type BookingStage = "upcoming" | "tomorrow" | "today" | "done" | "cancelled";

export const isActive = (b: Pick<Booking, "status">) =>
  b.status === "confirmed" || b.status === "pending";

export function daysUntil(dateKey: string, now: Date): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function bookingStage(b: Booking, now: Date): BookingStage {
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "completed") return "done";
  const days = daysUntil(b.date, now);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return "upcoming";
}

/** 미용이 끝나는(픽업) 예상 시각 */
export function endTimeOf(b: Pick<Booking, "time" | "serviceId">): string {
  const [h, m] = b.time.split(":").map(Number);
  const end = h * 60 + m + (getServiceById(b.serviceId)?.durationMin ?? 60);
  return `${`${Math.floor(end / 60)}`.padStart(2, "0")}:${`${end % 60}`.padStart(2, "0")}`;
}

/** 일정 변경·취소는 방문 전날까지 (당일은 매장에 직접 문의) */
export function canModify(b: Booking, now: Date): boolean {
  return isActive(b) && daysUntil(b.date, now) >= 1;
}

/** 아이별 이용 이력 요약 */
export function petHistory(petId: string, bookings: Booking[]) {
  const mine = bookings.filter((b) => b.petId === petId);
  const byDateDesc = (a: Booking, b: Booking) =>
    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`);
  const last = mine.filter((b) => b.status === "completed").sort(byDateDesc)[0];
  const upcoming = mine
    .filter(isActive)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  return { last, upcoming, visits: mine.filter((b) => b.status === "completed").length };
}

/** 지난 미용과 서비스 권장 주기로 계산한 다음 미용 추천일 */
export function nextGroomingDate(last: Pick<Booking, "date" | "serviceId">): string {
  const weeks = getServiceById(last.serviceId)?.cycleWeeks ?? 6;
  const [y, m, d] = last.date.split("-").map(Number);
  return toDateKey(addDays(new Date(y, m - 1, d), weeks * 7));
}

/** 방문 전 준비 안내 — 공통 항목 */
export const VISIT_CHECKLIST = [
  "방문 전에 산책과 배변을 마쳐주세요",
  "최근 1년 안의 예방접종 기록을 확인해주세요",
  "피부·컨디션이 평소와 다르면 미용사에게 먼저 알려주세요",
  "예약 10분 전까지 도착해주세요",
];
