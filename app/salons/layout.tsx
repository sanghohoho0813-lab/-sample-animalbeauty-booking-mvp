import type { Metadata } from "next";
import type { ReactNode } from "react";

// 페이지는 클라이언트 컴포넌트라 metadata를 직접 내보낼 수 없어 세그먼트 레이아웃에서 지정한다
export const metadata: Metadata = {
  title: "미용실 찾기",
  description: "우리 동네 반려동물 미용실을 거리·평점·리뷰 순으로 비교하고 바로 예약하세요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
