"use client";

import { CalendarCheck, Heart, Home, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hidesTabBar } from "@/lib/routes";

const ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/salons", label: "검색", icon: Search },
  { href: "/bookings", label: "예약", icon: CalendarCheck },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/my", label: "마이", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 예약 진행·미용실 상세는 자체 하단 고정 버튼과 겹치지 않도록 숨긴다
  if (hidesTabBar(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200/80 bg-white/90 backdrop-blur-xl backdrop-saturate-150 safe-bottom lg:hidden"
      aria-label="하단 메뉴"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-[56px] flex-1 flex-col items-center gap-0.5 px-2 pb-2 pt-2.5 text-xs transition-colors ${
                active ? "font-bold text-ink" : "font-medium text-ink-faint hover:text-ink-muted"
              }`}
            >
              <Icon
                aria-hidden
                className={`h-6 w-6 ${active ? "text-mint-600" : ""}`}
                strokeWidth={active ? 2.3 : 1.7}
                fill={active && href === "/favorites" ? "currentColor" : "none"}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
