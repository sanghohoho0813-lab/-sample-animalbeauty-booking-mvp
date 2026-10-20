"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useDb } from "./db";
import { buildNotifications, unreadCount, type AppNotification } from "./notifications";
import { useNow } from "./use-now";

/**
 * 알림함 읽음 상태 — 마지막으로 알림함을 연 시각 하나만 저장한다.
 * 그 이후에 생긴 알림이 '새 알림'. 다른 탭에서 읽어도 함께 사라진다.
 */
const KEY = "pawbeauty-inbox-seen-v1";
let seenAt: string | null | undefined;
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    seenAt = e.newValue;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (seenAt === undefined) seenAt = read();
  return seenAt;
}

export function useInboxSeenAt(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** 알림함을 열었다 — 지금까지의 알림을 모두 읽음으로 */
export function markInboxSeen(now: Date) {
  seenAt = now.toISOString();
  try {
    localStorage.setItem(KEY, seenAt);
  } catch {
    /* 저장이 막혀도 이번 방문 동안은 읽음으로 */
  }
  listeners.forEach((l) => l());
}

/** 지금 알림 목록과 읽지 않은 개수 (날짜 계산이 필요해 마운트 전에는 null) */
export function useNotifications(): {
  list: AppNotification[] | null;
  unread: number;
  seenAt: string | null;
} {
  const { pets, bookings, reviews, hydrated } = useDb();
  const now = useNow();
  const seen = useInboxSeenAt();
  const list = useMemo(
    () => (hydrated && now ? buildNotifications({ pets, bookings, reviews, now }) : null),
    [hydrated, now, pets, bookings, reviews]
  );
  return { list, unread: list ? unreadCount(list, seen) : 0, seenAt: seen };
}
