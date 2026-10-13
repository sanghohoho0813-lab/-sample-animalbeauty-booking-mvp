import { COUPONS } from "./data";
import type { Booking, Coupon } from "./types";

/**
 * 쿠폰 규칙.
 * - 멤버 할인처럼 reusable 쿠폰은 계속 쓸 수 있다
 * - 1회용 쿠폰은 취소되지 않은 예약에 한 번 쓰면 소진된다 (예약을 취소하면 다시 쓸 수 있다)
 * - 첫 방문 쿠폰은 한 번도 방문(예정 포함)하지 않은 미용실에서만
 * - 서비스 전용 쿠폰은 해당 서비스에서만
 */

/** 예약 확인 화면의 쿠폰 선택값 — 자동(가장 큰 할인) · 사용 안 함 · 특정 쿠폰 id */
export type CouponChoice = "auto" | "none" | string;

export interface CouponContext {
  serviceId: string | null;
  salonId: string | null;
  bookings: Booking[];
  /** 일정 변경처럼 자기 자신을 사용 이력에서 빼야 할 때 */
  excludeBookingId?: string;
}

const counts = (b: Booking) => b.status !== "cancelled";

export function isCouponUsed(
  coupon: Coupon,
  ctx: Pick<CouponContext, "bookings" | "excludeBookingId">
) {
  if (coupon.reusable) return false;
  return ctx.bookings.some(
    (b) => b.id !== ctx.excludeBookingId && b.couponId === coupon.id && counts(b)
  );
}

export function isFirstVisit(salonId: string, bookings: Booking[], excludeBookingId?: string) {
  return !bookings.some((b) => b.id !== excludeBookingId && b.salonId === salonId && counts(b));
}

/** 이 예약에 쓸 수 없는 이유 (쓸 수 있으면 null) */
export function couponBlocker(coupon: Coupon, ctx: CouponContext): string | null {
  if (isCouponUsed(coupon, ctx)) return "이미 사용한 쿠폰이에요";
  if (coupon.serviceIds && (!ctx.serviceId || !coupon.serviceIds.includes(ctx.serviceId))) {
    return "다른 서비스 전용 쿠폰이에요";
  }
  if (
    coupon.firstVisitOnly &&
    ctx.salonId &&
    !isFirstVisit(ctx.salonId, ctx.bookings, ctx.excludeBookingId)
  ) {
    return "이전에 방문한 미용실이에요";
  }
  return null;
}

export function discountOf(coupon: Coupon, price: number): number {
  if (coupon.amount) return Math.min(coupon.amount, price);
  return Math.floor(price * (coupon.discountRate ?? 0));
}

/** 쓸 수 있는 쿠폰을 할인 금액이 큰 순서로 */
export function usableCoupons(price: number, ctx: CouponContext): Coupon[] {
  return COUPONS.filter((c) => !couponBlocker(c, ctx)).sort(
    (a, b) => discountOf(b, price) - discountOf(a, price)
  );
}

/** 선택값을 실제 적용할 쿠폰으로 — 고른 쿠폰을 쓸 수 없게 되면 자동으로 가장 큰 할인 */
export function resolveCoupon(
  choice: CouponChoice,
  price: number,
  ctx: CouponContext
): Coupon | null {
  if (choice === "none" || price <= 0) return null;
  const usable = usableCoupons(price, ctx);
  if (choice !== "auto") {
    const chosen = usable.find((c) => c.id === choice);
    if (chosen) return chosen;
  }
  return usable[0] ?? null;
}
