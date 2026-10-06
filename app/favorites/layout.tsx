import type { Metadata } from "next";
import type { ReactNode } from "react";

// 페이지는 클라이언트 컴포넌트라 metadata를 직접 내보낼 수 없어 세그먼트 레이아웃에서 지정한다
export const metadata: Metadata = {
  title: "찜한 미용실",
  description: "마음에 든 미용실을 모아두고 빠르게 예약하세요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
