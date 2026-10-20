"use client";

import {
  Bell,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  ChevronRight,
  MessageSquareHeart,
  Scissors,
  Sun,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { markInboxSeen, useNotifications } from "@/lib/inbox";
import { noticeGroup, noticeTime, type NotificationKind } from "@/lib/notifications";
import { useNow } from "@/lib/use-now";

const KIND: Record<NotificationKind, { icon: LucideIcon; tone: string; label: string }> = {
  confirmed: { icon: CalendarCheck, tone: "bg-mint-50 text-mint-700", label: "예약" },
  changed: { icon: CalendarClock, tone: "bg-mint-50 text-mint-700", label: "예약 변경" },
  cancelled: { icon: CalendarX, tone: "bg-cream-200 text-ink-soft", label: "예약 취소" },
  reminder: { icon: Bell, tone: "bg-amber-50 text-amber-800", label: "방문 안내" },
  today: { icon: Sun, tone: "bg-coral-50 text-coral-700", label: "오늘 방문" },
  review: { icon: MessageSquareHeart, tone: "bg-coral-50 text-coral-700", label: "후기" },
  due: { icon: Scissors, tone: "bg-mint-50 text-mint-700", label: "미용 시기" },
  coupon: { icon: Ticket, tone: "bg-coral-50 text-coral-700", label: "쿠폰" },
};

/**
 * 알림함 — 예약·방문·후기·미용 시기·쿠폰 소식을 시간순으로.
 * 들어오는 순간 모두 읽음 처리하되, 이번에 처음 보는 알림은 이 화면에서는 표시를 남겨 둔다.
 */
export default function NotificationsPage() {
  const now = useNow();
  const { list, seenAt } = useNotifications();
  // 이 화면을 열 때의 '마지막으로 본 시각' — 새 알림 표시는 이걸 기준으로
  const [openedSeenAt, setOpenedSeenAt] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!now || openedSeenAt !== undefined) return;
    setOpenedSeenAt(seenAt);
    markInboxSeen(now);
  }, [now, seenAt, openedSeenAt]);

  const isNew = (iso: string) => openedSeenAt === null || (!!openedSeenAt && iso > openedSeenAt);
  const newCount = list && openedSeenAt !== undefined ? list.filter((n) => isNew(n.at)).length : 0;

  const groups = new Map<string, NonNullable<typeof list>>();
  if (list && now) {
    for (const n of list) {
      const g = noticeGroup(n.at, now);
      groups.set(g, [...(groups.get(g) ?? []), n]);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">알림</h1>
          <p className="mt-0.5 text-sm text-ink-muted" aria-live="polite">
            {newCount > 0 ? `새 알림 ${newCount}개` : "예약과 우리 아이 소식을 모아 보여드려요"}
          </p>
        </div>
        <Link
          href="/my#settings"
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-cream-100 hover:text-ink"
        >
          알림 설정
        </Link>
      </div>

      {!list && (
        <div className="mt-6 space-y-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[5.25rem] rounded-2xl" />
          ))}
        </div>
      )}

      {list && list.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Bell}
            title="아직 알림이 없어요"
            desc="예약을 하면 방문 전날 안내와 후기 요청을 이곳에서 알려드려요."
            actionHref="/booking"
            actionLabel="예약하러 가기"
          />
        </div>
      )}

      {[...groups.entries()].map(([group, items]) => (
        <section key={group} className="mt-6" aria-labelledby={`inbox-${group}`}>
          <h2 id={`inbox-${group}`} className="px-1 text-sm font-bold text-ink-muted">
            {group}
          </h2>
          <ul className="mt-2 divide-y divide-cream-200 overflow-hidden rounded-3xl bg-white ring-1 ring-cream-200">
            {items.map((n) => {
              const { icon: Icon, tone, label } = KIND[n.kind];
              const fresh = isNew(n.at);
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`flex gap-3.5 px-4 py-4 transition-colors hover:bg-cream-50 md:px-5 ${
                      fresh ? "bg-mint-50/40" : ""
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className="font-semibold">{label}</span>
                        <span aria-hidden>·</span>
                        <span>{noticeTime(n.at, now!)}</span>
                        {fresh && (
                          <>
                            <span
                              className="ml-0.5 h-1.5 w-1.5 rounded-full bg-coral-500"
                              aria-hidden
                            />
                            <span className="sr-only">새 알림</span>
                          </>
                        )}
                      </span>
                      <span className="mt-0.5 block text-base font-bold leading-snug text-ink">
                        {n.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">
                        {n.body}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-5 w-5 shrink-0 self-center text-ink-faint"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
