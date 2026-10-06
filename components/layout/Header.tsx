"use client";

import { PawPrint } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/booking", label: "예약하기" },
  { href: "/salons", label: "미용실 찾기" },
  { href: "/pets", label: "내 반려동물" },
  { href: "/bookings", label: "예약 내역" },
  { href: "/my", label: "마이페이지" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16 md:px-6">
        <Link href="/" className="flex items-center gap-1.5 tap" aria-label="PawBeauty 홈">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-500 text-white">
            <PawPrint className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-mint-700">PawBeauty</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-mint-100 text-mint-700"
                    : "text-ink-soft hover:bg-cream-100 hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/my"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-100 text-lg tap"
            aria-label="마이페이지"
          >
            🐶
          </Link>
        </div>
      </div>
    </header>
  );
}
