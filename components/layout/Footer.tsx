import { PawPrint } from "lucide-react";
import Link from "next/link";
import MiraeLogo from "@/components/brand/MiraeLogo";
import { MIRAE_LINKS } from "@/lib/mirae";

const SERVICE_LINKS = [
  { href: "/booking", label: "미용 예약" },
  { href: "/salons", label: "미용실 찾기" },
  { href: "/my", label: "쿠폰·알림 설정" },
];

const HELP_LINKS = [
  { href: "/help#policy", label: "예약 변경·취소 규정" },
  { href: "/help#visit", label: "방문 전 준비" },
  { href: "/help#faq", label: "자주 묻는 질문" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-cream-200 bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mint-500 text-white">
                <PawPrint className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="text-base font-extrabold tracking-[-0.02em] text-ink">
                Paw<span className="text-mint-600">Beauty</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              우리 아이의 특별한 하루를 위한
              <br />
              반려동물 미용 예약 서비스
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <div>
              <p className="font-bold text-ink">서비스</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                {SERVICE_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-mint-700 hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-ink">이용 안내</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                {HELP_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-mint-700 hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="font-bold text-ink">서비스 도입 문의</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li>
                  <a
                    href={MIRAE_LINKS.consult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-mint-700 hover:underline"
                  >
                    우리 회사도 만들어보기<span className="sr-only"> (새 창)</span>
                  </a>
                </li>
                <li>
                  <a
                    href={MIRAE_LINKS.home}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-mint-700 hover:underline"
                  >
                    미래에이아이랩 홈페이지<span className="sr-only"> (새 창)</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-cream-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <MiraeLogo className="h-10 w-auto md:h-12" />
            <span className="border-l border-cream-300 pl-3 text-xs leading-relaxed text-ink-muted">
              기획 · 디자인 · 개발
              <br />
              <b className="text-ink-soft">미래에이아이랩</b>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            © 2026 미래에이아이랩 (MIRAE AI LAB).
            <br className="hidden sm:block" /> 본 서비스는 포트폴리오 시연용 MVP 레퍼런스입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
