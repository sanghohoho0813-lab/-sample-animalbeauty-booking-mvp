"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** 예약 플로우에서 선택한 값들. 새로고침에도 유지되도록 sessionStorage에 저장한다. */
export interface BookingDraft {
  petId: string | null;
  serviceId: string | null;
  salonId: string | null;
  groomerId: string | null;
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:mm
  useCoupon: boolean;
}

const EMPTY_DRAFT: BookingDraft = {
  petId: null,
  serviceId: null,
  salonId: null,
  groomerId: null,
  date: null,
  time: null,
  useCoupon: true,
};

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
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDraftState({ ...EMPTY_DRAFT, ...(JSON.parse(raw) as BookingDraft) });
      }
    } catch {
      // ignore
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
