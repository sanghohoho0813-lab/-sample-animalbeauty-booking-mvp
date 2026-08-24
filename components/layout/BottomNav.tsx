"use client";

import {
  CalendarCheck,
  Heart,
  Home,
  Search,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/salons", label: "검색", icon: Search },
  { href: "/bookings", label: "예약", icon: CalendarCheck },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/my", label: "마이", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 예약 플로우에서는 하단 CTA와 겹치지 않도록 숨긴다
  if (pathname.startsWith("/booking") && !pathname.startsWith("/bookings")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 backdrop-blur-md safe-bottom md:hidden"
      aria-label="하단 메뉴"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[56px] flex-col items-center gap-0.5 px-3 pb-2 pt-2.5 text-[11px] font-semibold transition-colors ${
                active ? "text-mint-600" : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={active ? 2.4 : 1.8}
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
