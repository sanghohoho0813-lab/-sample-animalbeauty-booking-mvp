import type { Metadata } from "next";
import type { ReactNode } from "react";

// 페이지는 클라이언트 컴포넌트라 metadata를 직접 내보낼 수 없어 세그먼트 레이아웃에서 지정한다
export const metadata: Metadata = {
  title: "내 반려동물",
  description: "우리 아이들의 정보를 등록하고 관리하세요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
