import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "예약 확인",
  // 예약마다 다른 개인 화면이라 검색 노출하지 않는다
  robots: { index: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
