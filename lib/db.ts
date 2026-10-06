"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEMO_USER, getServiceById } from "./data";
import { loadDb, makeBookingNo, newId } from "./db-core";
import { toDateKey } from "./format";
import type { Booking, BookingStatus, Pet, Review } from "./types";

export { makeBookingNo };

/**
 * PawBeauty demo data layer.
 *
 * MVP에서는 Supabase 대신 localStorage 기반의 클라이언트 데이터 레이어를 사용한다.
 * 테이블 구조(pets / bookings / favorites / reviews)는 supabase/schema.sql 과 같게 유지해
 * 이후 Supabase 연동 시 이 모듈만 교체하면 된다.
 *
 * - 읽기: useSyncExternalStore로 구독 (서버 렌더 시에는 빈 상태 → 하이드레이션 불일치 없음)
 * - 검증·시드·마이그레이션 같은 순수 로직은 db-core.ts (단위 테스트 대상)
 * - 다른 탭에서 바뀐 내용은 storage 이벤트로 즉시 반영
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pets, bookings, favorites, reviews }));
  } catch {
    // 저장소를 쓸 수 없음(사생활 보호 모드·용량 초과 등) — 이번 방문 동안 메모리 상태로만 동작
  }
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function initDb() {
  if (state.hydrated) return;
  state = { hydrated: true, ...loadDb(readStorage(), new Date()) };
  persist();
  emit();

  // 다른 탭에서 예약·찜을 바꾸면 이 탭에도 바로 반영한다
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = { hydrated: true, ...loadDb(e.newValue, new Date()) };
    emit();
  });
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
  const newPet: Pet = { ...pet, id: newId("pet") };
  update({ pets: [...state.pets, newPet] });
  return newPet;
}

export function addBooking(
  input: Omit<Booking, "id" | "bookingNo" | "createdAt" | "status">
): Booking {
  const now = new Date();
  const id = newId("bk");
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

/**
 * 예약 취소 — 저장소의 최신 상태가 '예정'일 때만 취소한다.
 * (다른 탭에서 이미 취소했거나, 그 사이 이용 완료로 넘어간 예약은 그대로 두고 false)
 */
export function cancelBooking(id: string): boolean {
  const current = state.bookings.find((b) => b.id === id);
  if (!current || (current.status !== "confirmed" && current.status !== "pending")) {
    return false;
  }
  setBookingStatus(id, "cancelled");
  return true;
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
    id: newId("rev"),
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
    bookings: state.bookings.map((b) => (b.id === booking.id ? { ...b, reviewed: true } : b)),
  });
  return review;
}

/** 사용자 후기 중 특정 미용실/미용사에 달린 개수 */
export function countReviews(reviews: Review[], key: "salonId" | "groomerId", id: string): number {
  return reviews.reduce((n, r) => (r[key] === id ? n + 1 : n), 0);
}

export function toggleFavorite(salonId: string) {
  const has = state.favorites.includes(salonId);
  update({
    favorites: has ? state.favorites.filter((f) => f !== salonId) : [...state.favorites, salonId],
  });
}

export function getBookingById(id: string): Booking | null {
  return state.bookings.find((b) => b.id === id) ?? null;
}
