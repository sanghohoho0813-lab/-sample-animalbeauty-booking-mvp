"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CouponChoice } from "./coupons";

/** 예약 플로우에서 선택한 값들. 새로고침에도 유지되도록 sessionStorage에 저장한다. */
export interface BookingDraft {
  petId: string | null;
  serviceId: string | null;
  salonId: string | null;
  groomerId: string | null;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm
  /** 쿠폰 선택 — 기본은 자동(가장 큰 할인) */
  couponId: CouponChoice;
  /** 요청사항 (선택형 + 짧은 메모). requestPetId는 이 요청사항이 어느 아이 것인지 —
   *  아이가 바뀌면 그 아이의 지난 요청사항으로 다시 채운다 */
  requestTags: string[];
  requestMemo: string;
  requestPetId: string | null;
}

export const EMPTY_DRAFT: BookingDraft = {
  petId: null,
  serviceId: null,
  salonId: null,
  groomerId: null,
  date: null,
  time: null,
  couponId: "auto",
  requestTags: [],
  requestMemo: "",
  requestPetId: null,
};

/** sessionStorage의 값 → 선택값 (이전 버전 모양이나 깨진 값은 기본값으로) */
export function parseDraft(raw: string | null): BookingDraft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    const str = (x: unknown) => (typeof x === "string" && x ? x : null);
    return {
      petId: str(v.petId),
      serviceId: str(v.serviceId),
      salonId: str(v.salonId),
      groomerId: str(v.groomerId),
      date: str(v.date),
      time: str(v.time),
      couponId: str(v.couponId) ?? "auto",
      requestTags: Array.isArray(v.requestTags)
        ? v.requestTags.filter((t): t is string => typeof t === "string")
        : [],
      requestMemo: typeof v.requestMemo === "string" ? v.requestMemo.slice(0, 80) : "",
      requestPetId: str(v.requestPetId),
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

const STORAGE_KEY = "pawbeauty-booking-draft-v1";

interface BookingContextValue {
  draft: BookingDraft;
  ready: boolean;
  setDraft: (patch: Partial<BookingDraft>) => void;
  resetDraft: () => void;
}

const BookingContext = createContext<BookingContextValue>({
  draft: EMPTY_DRAFT,
  ready: false,
  setDraft: () => {},
  resetDraft: () => {},
});

export function useBookingDraft() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<BookingDraft>(EMPTY_DRAFT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDraftState(parseDraft(sessionStorage.getItem(STORAGE_KEY)));
    } catch {
      // 저장소 접근 불가 — 빈 선택값으로 시작
    }
    setReady(true);
  }, []);

  const setDraft = useCallback((patch: Partial<BookingDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(EMPTY_DRAFT);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <BookingContext.Provider value={{ draft, ready, setDraft, resetDraft }}>
      {children}
    </BookingContext.Provider>
  );
}
