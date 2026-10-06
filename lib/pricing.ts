import type { Salon, Service } from "./types";

/**
 * 미용실마다 가격대가 다르다. `salon.priceFrom`은 그 미용실의 '기본 미용' 가격이고,
 * 다른 서비스도 같은 비율로 계산한다 (1,000원 단위 반올림).
 * 미용실을 고르기 전에는 서비스 기준가를 보여준다.
 */
export const BASE_SERVICE_PRICE = 45000;

export function priceAt(
  service: Pick<Service, "price">,
  salon?: Pick<Salon, "priceFrom"> | null
): number {
  if (!salon) return service.price;
  return Math.round((service.price * salon.priceFrom) / BASE_SERVICE_PRICE / 1000) * 1000;
}
