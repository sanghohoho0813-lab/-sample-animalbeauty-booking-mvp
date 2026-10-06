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
}

export interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceFrom: number;
  availableToday: boolean;
  /** 특정 종만 받는 미용실 (없으면 강아지·고양이 모두) */
  species?: Species;
  tags: string[];
  address: string;
  openHours: string;
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
}

export interface Coupon {
  id: string;
  name: string;
  desc: string;
  discountRate: number; // 0.1 = 10%
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
