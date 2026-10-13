export type Species = "dog" | "cat";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string;
  age: number; // 살
  weight: number; // kg
  emoji: string;
  /** public/ 기준 이미지 경로. 사용자가 새로 등록한 아이는 이모지로 표시한다. */
  image?: string;
  note?: string;
}

export interface Service {
  id: string;
  name: string;
  shortDesc: string;
  desc: string;
  price: number;
  durationMin: number;
  emoji: string;
  popular?: boolean;
  /** 특정 종 전용 서비스 (없으면 모든 반려동물 가능) */
  species?: Species;
  /** 권장 관리 주기(주) — 다음 미용 추천 시기 계산에 쓴다 */
  cycleWeeks: number;
}

/** 매장 시설·편의 — 아이콘과 문구는 lib/salon-info.ts */
export type Amenity =
  | "parking"
  | "cctv"
  | "private_room"
  | "low_noise_dryer"
  | "no_anesthesia"
  | "large_dog"
  | "cat_room"
  | "photo_report"
  | "pickup"
  | "spa_equipment";

export interface ReviewKeyword {
  label: string;
  /** 이 키워드를 고른 누적 후기 수 */
  count: number;
}

export interface Salon {
  id: string;
  name: string;
  /** 한 줄 소개 — 이 매장이 어떤 아이에게 잘 맞는지 */
  headline: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  /** 이 매장의 '기본 미용' 가격 (다른 서비스는 같은 비율 — lib/pricing.ts) */
  priceFrom: number;
  /** 특정 종만 받는 미용실 (없으면 강아지·고양이 모두) */
  species?: Species;
  /** 대표 전문 분야 */
  tags: string[];
  /** 자주 오는·잘하는 견종/묘종 */
  breeds: string[];
  amenities: Amenity[];
  /** 이용 전 알아둘 점 */
  notices: string[];
  /** 후기에서 많이 고른 키워드 (누적) */
  reviewKeywords: ReviewKeyword[];
  /** 최근 7일 예약 건수 */
  weeklyBookings: number;
  address: string;
  /** "HH:mm - HH:mm" — 예약 가능 시간은 이 범위에서 만든다 */
  openHours: string;
  /** 정기 휴무 요일 (0=일 … 6=토) */
  closedWeekdays: number[];
  emoji: string;
  gradient: string; // 이미지 로딩 전 배경으로 사용하는 tailwind gradient
  image: string;
}

export interface Groomer {
  id: string;
  salonId: string;
  name: string;
  careerYears: number;
  rating: number;
  reviewCount: number;
  specialties: string[];
  intro: string;
  premium?: boolean;
  emoji: string;
  image?: string;
}

export interface Review {
  id: string;
  /** 이 후기를 남긴 예약 (사용자가 작성한 후기에만 존재) */
  bookingId?: string;
  salonId: string;
  groomerId?: string;
  author: string;
  petName: string;
  rating: number;
  content: string;
  date: string; // YYYY-MM-DD
  serviceName: string;
  /** 후기 작성 시 고른 키워드 */
  keywords?: string[];
}

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  bookingNo: string;
  petId: string;
  serviceId: string;
  salonId: string;
  groomerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  price: number;
  discount: number;
  total: number;
  status: BookingStatus;
  createdAt: string; // ISO
  reviewed?: boolean;
  /** 적용한 쿠폰 */
  couponId?: string;
  /** 미용사에게 전달할 요청사항 (선택형 + 짧은 메모) */
  request?: BookingRequest;
  /** 일정을 바꾼 시각 (ISO) — 바꾸기 전 일정은 previous에 */
  rescheduledAt?: string;
  previous?: { date: string; time: string };
  cancelledAt?: string;
}

export interface BookingRequest {
  tags: string[];
  memo: string;
}

export interface Coupon {
  id: string;
  name: string;
  desc: string;
  /** 정률 할인 (0.1 = 10%) — amount와 둘 중 하나 */
  discountRate?: number;
  /** 정액 할인 (원) */
  amount?: number;
  /** 여러 번 쓸 수 있는 멤버십 혜택인지 (아니면 1회용 — 예약에 쓰면 소진, 취소하면 복구) */
  reusable?: boolean;
  /** 이 서비스에만 쓸 수 있음 */
  serviceIds?: string[];
  /** 처음 방문하는 미용실에서만 */
  firstVisitOnly?: boolean;
  /** 유효기간: 이번 달 말일 기준 n개월 뒤 말일까지 (데모가 언제 열려도 만료되지 않게 상대값으로 둔다) */
  expiresInMonths: number;
}

export interface DemoUser {
  name: string;
  /** 소속 (데모 계정이 미래에이아이랩 소속임을 표시) */
  org: string;
  email: string;
  membership: string;
  emoji: string;
}
