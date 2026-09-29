"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEMO_USER, getServiceById, SEED_PETS } from "./data";
import { addDays, hashString, toDateKey } from "./format";
import type { Booking, BookingStatus, Pet, Review } from "./types";

/**
 * PawBeauty demo data layer.
 *
 * MVP에서는 Supabase 대신 localStorage 기반의 클라이언트 데이터 레이어를 사용한다.
 * 테이블 구조(pets / bookings / favorites)는 supabase/schema.sql 과 동일하게 유지해
 * 이후 Supabase 연동 시 이 모듈만 교체하면 된다.
 */

const STORAGE_KEY = "pawbeauty-db-v1";

export interface DbState {
  hydrated: boolean;
  pets: Pet[];
  bookings: Booking[];
  favorites: string[]; // salon ids
  reviews: Review[]; // 사용자가 작성한 후기
}

const EMPTY_STATE: DbState = {
  hydrated: false,
  pets: [],
  bookings: [],
  favorites: [],
  reviews: [],
};

let state: DbState = EMPTY_STATE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    const { pets, bookings, favorites, reviews } = state;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ pets, bookings, favorites, reviews })
    );
  } catch {
    // storage unavailable (private mode 등) — 메모리 상태로만 동작
  }
}

export function makeBookingNo(date: Date, seedKey: string): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const suffix = `${hashString(seedKey) % 10000}`.padStart(4, "0");
  return `PB${y}${m}${d}-${suffix}`;
}

function seedBookings(): Booking[] {
  const now = new Date();
  const mk = (
    id: string,
    offsetDays: number,
    time: string,
    petId: string,
    serviceId: string,
    salonId: string,
    groomerId: string,
    price: number,
    discount: number,
    status: BookingStatus,
    reviewed?: boolean
  ): Booking => {
    const date = toDateKey(addDays(now, offsetDays));
    return {
      id,
      bookingNo: makeBookingNo(addDays(now, offsetDays), id),
      petId,
      serviceId,
      salonId,
      groomerId,
      date,
      time,
      price,
      discount,
      total: price - discount,
      status,
      createdAt: addDays(now, Math.min(offsetDays - 3, -1)).toISOString(),
      reviewed,
    };
  };

  return [
    mk("bk-seed-1", 3, "10:00", "pet-1", "svc-1", "salon-1", "grm-1", 45000, 4500, "confirmed"),
    mk("bk-seed-2", 7, "14:00", "pet-2", "svc-3", "salon-4", "grm-8", 80000, 0, "confirmed"),
    mk("bk-seed-3", -5, "11:00", "pet-3", "svc-5", "salon-6", "grm-12", 60000, 0, "completed", true),
    mk("bk-seed-4", -20, "15:00", "pet-1", "svc-2", "salon-1", "grm-2", 65000, 6500, "completed", false),
    mk("bk-seed-5", -34, "09:00", "pet-2", "svc-4", "salon-5", "grm-10", 20000, 0, "completed", true),
    mk("bk-seed-6", -12, "13:00", "pet-1", "svc-1", "salon-2", "grm-4", 45000, 0, "cancelled"),
  ];
}

/**
 * 저장된 반려동물 목록에 최신 샘플 데이터를 반영한다.
 * 데모 3마리는 항상 SEED_PETS의 최신 정의(사진 등)를 따르고,
 * 사용자가 직접 등록한 아이는 저장된 그대로 유지한다.
 */
function mergeSeedPets(storedPets: Pet[]): Pet[] {
  const seedIds = new Set(SEED_PETS.map((p) => p.id));
  const custom = storedPets.filter((p) => !seedIds.has(p.id));
  return [...SEED_PETS, ...custom];
}

/**
 * 방문 시각이 이미 지난 '예정' 예약은 이용 완료로 넘긴다.
 * 데모를 며칠 뒤 다시 열어도 지난 날짜가 '예정된 예약'에 남지 않고,
 * 완료된 예약에서 후기를 쓸 수 있게 된다. (시간이 흘러야 바뀌는 실시간 로직이 아니라
 * 데이터를 불러오는 순간 한 번만 판정한다)
 */
function settlePastBookings(bookings: Booking[], now: Date): Booking[] {
  return bookings.map((b) => {
    if (b.status !== "confirmed" && b.status !== "pending") return b;
    const [y, m, d] = b.date.split("-").map(Number);
    const [hh, mm] = b.time.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm) < now
      ? { ...b, status: "completed" }
      : b;
  });
}

function initDb() {
  if (state.hydrated) return;
  let loaded: Partial<Omit<DbState, "hydrated">> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) loaded = JSON.parse(raw) as Partial<Omit<DbState, "hydrated">>;
  } catch {
    loaded = null;
  }
  const now = new Date();
  if (
    loaded &&
    Array.isArray(loaded.pets) &&
    Array.isArray(loaded.bookings) &&
    Array.isArray(loaded.favorites)
  ) {
    state = {
      hydrated: true,
      pets: mergeSeedPets(loaded.pets),
      bookings: settlePastBookings(loaded.bookings, now),
      favorites: loaded.favorites,
      // 후기 저장 이전 버전에서 넘어온 데이터에는 reviews가 없다
      reviews: Array.isArray(loaded.reviews) ? loaded.reviews : [],
    };
  } else {
    state = {
      hydrated: true,
      pets: SEED_PETS,
      bookings: seedBookings(),
      favorites: ["salon-1", "salon-4"],
      reviews: [],
    };
  }
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDb(): DbState {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY_STATE
  );
  useEffect(() => {
    initDb();
  }, []);
  return snapshot;
}

function update(next: Partial<Omit<DbState, "hydrated">>) {
  state = { ...state, ...next };
  persist();
  emit();
}

export function addPet(pet: Omit<Pet, "id">): Pet {
  const newPet: Pet = { ...pet, id: `pet-${Date.now()}` };
  update({ pets: [...state.pets, newPet] });
  return newPet;
}

export function addBooking(
  input: Omit<Booking, "id" | "bookingNo" | "createdAt" | "status">
): Booking {
  const now = new Date();
  const id = `bk-${Date.now()}`;
  const booking: Booking = {
    ...input,
    id,
    bookingNo: makeBookingNo(now, id),
    status: "confirmed",
    createdAt: now.toISOString(),
  };
  update({ bookings: [booking, ...state.bookings] });
  return booking;
}

export function setBookingStatus(id: string, status: BookingStatus) {
  update({
    bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
  });
}

/** 이용 완료된 예약에 후기를 남기고, 예약을 '후기 작성 완료'로 표시한다 */
export function addReview(
  booking: Booking,
  input: { rating: number; content: string; petName: string }
): Review | null {
  // 화면이 들고 있던 예약 객체가 아니라 저장소의 최신 상태로 판단한다 (연속 클릭 중복 방지)
  const current = state.bookings.find((b) => b.id === booking.id);
  if (!current || current.status !== "completed" || current.reviewed) {
    return null;
  }
  const review: Review = {
    id: `rev-${Date.now()}`,
    bookingId: booking.id,
    salonId: booking.salonId,
    groomerId: booking.groomerId,
    author: DEMO_USER.name,
    petName: input.petName,
    rating: input.rating,
    content: input.content,
    date: toDateKey(new Date()),
    serviceName: getServiceById(booking.serviceId)?.name ?? "",
  };
  update({
    reviews: [review, ...state.reviews],
    bookings: state.bookings.map((b) =>
      b.id === booking.id ? { ...b, reviewed: true } : b
    ),
  });
  return review;
}

/** 사용자 후기 중 특정 미용실/미용사에 달린 개수 */
export function countReviews(
  reviews: Review[],
  key: "salonId" | "groomerId",
  id: string
): number {
  return reviews.reduce((n, r) => (r[key] === id ? n + 1 : n), 0);
}

export function toggleFavorite(salonId: string) {
  const has = state.favorites.includes(salonId);
  update({
    favorites: has
      ? state.favorites.filter((f) => f !== salonId)
      : [...state.favorites, salonId],
  });
}

export function getBookingById(id: string): Booking | null {
  return state.bookings.find((b) => b.id === id) ?? null;
}
