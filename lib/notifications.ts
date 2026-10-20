import { couponExpiresOn, isCouponUsed } from "./coupons";
import { COUPONS, getGroomerById, getSalonById, getServiceById } from "./data";
import { addDays, formatDateShortKo } from "./format";
import { josa } from "./josa";
import { daysUntil, endTimeOf, isActive, nextGroomingDate, petHistory } from "./lifecycle";
import type { Booking, Pet, Review } from "./types";

/**
 * 알림함 — 따로 저장하지 않고 예약·반려동물·쿠폰 상태에서 그때그때 만들어낸다.
 * (서버 연동 시에는 같은 규칙으로 푸시를 보내고, 이 목록은 서버의 알림 기록으로 바뀐다)
 */
export type NotificationKind =
  "confirmed" | "changed" | "cancelled" | "reminder" | "today" | "review" | "due" | "coupon";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** 알림이 생긴 시각 (ISO) */
  at: string;
  href: string;
}

/** 알림함에 보여주는 최대 개수 */
export const NOTIFICATION_LIMIT = 30;
/** 쿠폰 만료 몇 일 전부터 알릴지 */
const COUPON_NOTICE_DAYS = 10;
/** 다음 미용 추천일 며칠 전부터 알릴지 */
const DUE_NOTICE_DAYS = 7;

/** 'YYYY-MM-DD' + 'HH:MM' → 그 시각 (로컬) */
function at(dateKey: string, time = "00:00"): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

const later = (a: Date, b: Date) => (a > b ? a : b);

export function buildNotifications({
  pets,
  bookings,
  reviews,
  now,
}: {
  pets: Pet[];
  bookings: Booking[];
  reviews: Review[];
  now: Date;
}): AppNotification[] {
  const out: AppNotification[] = [];
  const petName = (id: string) => pets.find((p) => p.id === id)?.name ?? "반려동물";
  const push = (n: Omit<AppNotification, "at"> & { at: Date }) => {
    if (n.at <= now) out.push({ ...n, at: n.at.toISOString() });
  };

  for (const b of bookings) {
    const pet = petName(b.petId);
    const service = getServiceById(b.serviceId)?.name ?? "미용";
    const salon = getSalonById(b.salonId)?.name ?? "";
    const groomer = getGroomerById(b.groomerId)?.name ?? "";
    const when = `${formatDateShortKo(b.date)} ${b.time}`;
    const created = new Date(b.createdAt);
    const href = `/bookings/${b.id}`;

    push({
      id: `confirmed-${b.id}`,
      kind: "confirmed",
      title: "예약이 확정됐어요",
      body: `${pet} · ${service} · ${b.previous ? `${formatDateShortKo(b.previous.date)} ${b.previous.time}` : when} · ${salon}`,
      at: created,
      href,
    });

    if (b.rescheduledAt && b.previous) {
      push({
        id: `changed-${b.id}-${b.rescheduledAt}`,
        kind: "changed",
        title: "예약 일정을 바꿨어요",
        body: `${formatDateShortKo(b.previous.date)} ${b.previous.time} → ${when} · ${salon}`,
        at: new Date(b.rescheduledAt),
        href,
      });
    }

    if (b.status === "cancelled") {
      const coupon = COUPONS.find((c) => c.id === b.couponId);
      push({
        id: `cancelled-${b.id}`,
        kind: "cancelled",
        title: "예약이 취소됐어요",
        body: `${pet} · ${service} · ${when}${coupon && !coupon.reusable ? " · 쓴 쿠폰은 다시 쓸 수 있어요" : ""}`,
        at: b.cancelledAt ? new Date(b.cancelledAt) : created,
        href,
      });
      continue;
    }

    if (isActive(b)) {
      const days = daysUntil(b.date, now);
      if (days <= 1) {
        // 방문 전날 저녁 6시 안내 (전날보다 늦게 예약했으면 예약 직후)
        push({
          id: `reminder-${b.id}-${b.date}`,
          kind: "reminder",
          title: `내일 ${b.time}, ${pet} 미용이 있어요`,
          body: `${salon} · 산책·배변을 마치고 10분 전까지 와주세요`,
          at: later(at(addDaysKey(b.date, -1), "18:00"), new Date(created.getTime() + 60_000)),
          href,
        });
      }
      if (days <= 0) {
        push({
          id: `today-${b.id}-${b.date}`,
          kind: "today",
          title: `오늘 ${b.time}, ${pet} 미용이에요`,
          body: `${salon} ${groomer} 미용사 · ${endTimeOf(b)}쯤 끝나요`,
          at: later(at(b.date, "08:00"), new Date(created.getTime() + 60_000)),
          href,
        });
      }
    }

    if (b.status === "completed") {
      const reviewed = b.reviewed || reviews.some((r) => r.bookingId === b.id);
      if (!reviewed) {
        push({
          id: `review-${b.id}`,
          kind: "review",
          title: `${pet} 미용은 어땠나요?`,
          body: `${salon} ${groomer} 미용사에게 후기를 남겨주세요`,
          at: at(b.date, endTimeOf(b)),
          href,
        });
      }
    }
  }

  // 미용할 때가 된 아이 (다가오는 예약이 없을 때만)
  for (const pet of pets) {
    const { last, upcoming } = petHistory(pet.id, bookings);
    if (!last || upcoming) continue;
    const next = nextGroomingDate(last);
    const noticeAt = later(at(addDaysKey(next, -DUE_NOTICE_DAYS), "09:00"), at(last.date, "23:00"));
    push({
      id: `due-${pet.id}-${next}`,
      kind: "due",
      title: `${pet.name} 미용할 때가 다가왔어요`,
      body: `다음 미용 추천일은 ${formatDateShortKo(next)}이에요 · 지난번 ${getServiceById(last.serviceId)?.name ?? "미용"}`,
      at: noticeAt,
      href: `/booking?pet=${pet.id}&step=1`,
    });
  }

  // 곧 끝나는 쿠폰 (아직 쓸 수 있는 것만)
  for (const coupon of COUPONS) {
    if (isCouponUsed(coupon, { bookings })) continue;
    const end = couponExpiresOn(coupon, now);
    const left = Math.round((end.getTime() - startOfDay(now).getTime()) / 86_400_000);
    if (left > COUPON_NOTICE_DAYS) continue;
    push({
      id: `coupon-${coupon.id}-${end.getMonth()}`,
      kind: "coupon",
      title: `${josa(coupon.name, "이가")} 곧 끝나요`,
      body: `${end.getMonth() + 1}월 ${end.getDate()}일까지 쓸 수 있어요 · ${coupon.desc}`,
      at: addDays(startOfDay(end), -COUPON_NOTICE_DAYS),
      href: "/my#coupons",
    });
  }

  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, NOTIFICATION_LIMIT);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysKey(dateKey: string, days: number): string {
  const d = addDays(at(dateKey), days);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

/** 읽지 않은 알림 수 — 마지막으로 알림함을 연 시각 이후에 생긴 것 */
export function unreadCount(list: AppNotification[], seenAt: string | null): number {
  return seenAt ? list.filter((n) => n.at > seenAt).length : list.length;
}

/** 알림 시각 표시 — '방금' · '3분 전' · '2시간 전' · '어제' · '3일 전' · '10월 1일' */
export function noticeTime(iso: string, now: Date): string {
  const t = new Date(iso);
  const mins = Math.floor((now.getTime() - t.getTime()) / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const days = Math.round((startOfDay(now).getTime() - startOfDay(t).getTime()) / 86_400_000);
  if (days === 0) return `${Math.floor(mins / 60)}시간 전`;
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return `${t.getMonth() + 1}월 ${t.getDate()}일`;
}

/** 알림함 묶음 머리글 */
export function noticeGroup(iso: string, now: Date): "오늘" | "최근 7일" | "이전 알림" {
  const days = Math.round(
    (startOfDay(now).getTime() - startOfDay(new Date(iso)).getTime()) / 86_400_000
  );
  if (days <= 0) return "오늘";
  if (days < 7) return "최근 7일";
  return "이전 알림";
}
