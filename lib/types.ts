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
}

export interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  priceFrom: number;
  availableToday: boolean;
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
  salonId: string;
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
  expiresAt: string;
}

export interface DemoUser {
  name: string;
  email: string;
  membership: string;
  emoji: string;
}
