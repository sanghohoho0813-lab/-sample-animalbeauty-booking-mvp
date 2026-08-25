import { PawPrint } from "lucide-react";
import MiraeLogo from "@/components/brand/MiraeLogo";

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
              <span className="text-base font-extrabold text-mint-700">
                PawBeauty
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
                <li>미용 예약</li>
                <li>미용실 찾기</li>
                <li>멤버십 &amp; 쿠폰</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-ink">고객지원</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li>공지사항</li>
                <li>자주 묻는 질문</li>
                <li>1:1 문의</li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="font-bold text-ink">문의</p>
              <ul className="mt-3 space-y-2 text-ink-muted">
                <li>평일 09:00 - 18:00</li>
                <li>hello@pawbeauty.demo</li>
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
          <p className="text-xs leading-relaxed text-ink-faint">
            © 2026 미래에이아이랩 (MIRAE AI LAB).
            <br className="hidden sm:block" /> 본 서비스는 포트폴리오 시연용 MVP
            레퍼런스입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
