import type { Metadata } from "next";
import type { ReactNode } from "react";

// 페이지는 클라이언트 컴포넌트라 metadata를 직접 내보낼 수 없어 세그먼트 레이아웃에서 지정한다
export const metadata: Metadata = {
  title: "미용 예약",
  description: "반려동물·서비스·미용실·미용사·일시를 차례로 골라 1분 만에 미용을 예약하세요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
