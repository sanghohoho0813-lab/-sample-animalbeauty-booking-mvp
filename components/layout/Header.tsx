"use client";

import { Bell, PawPrint, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEMO_USER } from "@/lib/data";
import { useNotifications } from "@/lib/inbox";

const NAV_ITEMS = [
  { href: "/booking", label: "예약하기" },
  { href: "/salons", label: "미용실 찾기" },
  { href: "/pets", label: "내 반려동물" },
  { href: "/bookings", label: "예약 내역" },
  { href: "/my", label: "마이페이지" },
];

export default function Header() {
  const pathname = usePathname();
  const { unread } = useNotifications();
  const onInbox = pathname === "/notifications";

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-50/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" className="flex items-center gap-1.5 tap" aria-label="PawBeauty 홈">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-mint-500 text-white">
            <PawPrint className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-extrabold tracking-[-0.02em] text-ink">
            Paw<span className="text-mint-600">Beauty</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3.5 -bottom-[0.6rem] h-[2px] rounded-full bg-mint-500"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/salons?focus=1"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream-100 hover:text-ink"
            aria-label="검색하기"
          >
            <Search className="h-[1.3rem] w-[1.3rem]" strokeWidth={2} />
          </Link>
          <Link
            href="/notifications"
            aria-current={onInbox ? "page" : undefined}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-cream-100 hover:text-ink ${
              onInbox ? "text-ink" : "text-ink-soft"
            }`}
            aria-label={unread > 0 ? `알림, 새 알림 ${unread}개` : "알림"}
          >
            <Bell
              className="h-[1.3rem] w-[1.3rem]"
              strokeWidth={2}
              fill={onInbox ? "currentColor" : "none"}
            />
            {unread > 0 && !onInbox && (
              <span
                className="absolute right-1 top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-coral-600 px-1 text-[0.7rem] font-bold leading-none text-white ring-2 ring-cream-50 animate-scale-in"
                aria-hidden
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/my"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-white ring-2 ring-white transition-transform tap"
            aria-label="마이페이지"
          >
            {DEMO_USER.name.slice(0, 1)}
          </Link>
        </div>
      </div>
    </header>
  );
}
