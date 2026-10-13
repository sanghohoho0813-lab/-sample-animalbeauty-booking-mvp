import type { BookingDraft } from "./booking-context";
import { discountOf, resolveCoupon } from "./coupons";
import { getSalonById, getServiceById } from "./data";
import { priceAt } from "./pricing";
import type { Booking } from "./types";

/** 예약 선택값의 결제 금액 — 미용실별 가격 + 쿠폰 */
export function quote(
  draft: Pick<BookingDraft, "serviceId" | "salonId" | "couponId">,
  bookings: Booking[],
  excludeBookingId?: string
) {
  const service = getServiceById(draft.serviceId);
  const price = service ? priceAt(service, getSalonById(draft.salonId)) : 0;
  const coupon = resolveCoupon(draft.couponId, price, {
    serviceId: draft.serviceId,
    salonId: draft.salonId,
    bookings,
    excludeBookingId,
  });
  const discount = coupon ? discountOf(coupon, price) : 0;
  return { price, coupon, discount, total: price - discount };
}
