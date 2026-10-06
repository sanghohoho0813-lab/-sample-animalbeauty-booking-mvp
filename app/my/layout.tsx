import type { Metadata } from "next";
import type { ReactNode } from "react";

// 페이지는 클라이언트 컴포넌트라 metadata를 직접 내보낼 수 없어 세그먼트 레이아웃에서 지정한다
export const metadata: Metadata = {
  title: "마이페이지",
  description: "쿠폰, 알림 설정, 내 반려동물을 확인하세요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
