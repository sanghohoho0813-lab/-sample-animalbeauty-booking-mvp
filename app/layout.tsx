import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import MiraeBrandBar from "@/components/brand/MiraeBrandBar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { BookingProvider } from "@/lib/booking-context";
import { ToastProvider } from "@/lib/toast";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FCFAF7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐾</text></svg>"
        />
      </head>
      <body className="min-h-dvh">
        <ToastProvider>
          <BookingProvider>
            <MiraeBrandBar />
            <Header />
            <main className="pb-24 lg:pb-0">{children}</main>
            <BottomNav />
          </BookingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
