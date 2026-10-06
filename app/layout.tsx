import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import MiraeBrandBar from "@/components/brand/MiraeBrandBar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PageBottom from "@/components/layout/PageBottom";
import { BookingProvider } from "@/lib/booking-context";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";
import Script from "next/script";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

// 배포 주소(공유 미리보기 이미지의 절대 URL 계산용). 없으면 로컬 주소로 둔다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PawBeauty — 반려동물 미용 예약",
    template: "%s | PawBeauty",
  },
  description:
    "우리 아이의 특별한 하루를 위한 반려동물 미용 예약 서비스. 미래에이아이랩(MIRAE AI LAB)이 기획·개발한 MVP 레퍼런스입니다.",
  applicationName: "PawBeauty",
  authors: [{ name: "미래에이아이랩 (MIRAE AI LAB)" }],
  creator: "미래에이아이랩 (MIRAE AI LAB)",
  publisher: "미래에이아이랩 (MIRAE AI LAB)",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "PawBeauty",
    title: "PawBeauty — 반려동물 미용 예약",
    description:
      "반려동물·서비스·미용실·미용사·일시까지 1분 만에 예약하는 반려동물 미용 예약 서비스",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FCFAF7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="min-h-dvh">
        {/* 미래AI랩 데모 공용 뒤로·앞으로 버튼 */}
        <Script src="/mirae-history-nav.js" strategy="beforeInteractive" />
        <a
          href="#main"
          className="sr-only z-[200] rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          본문으로 건너뛰기
        </a>
        <ToastProvider>
          <BookingProvider>
            <MiraeBrandBar />
            <Header />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <PageBottom />
            <BottomNav />
          </BookingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
