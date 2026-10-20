import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "우리 아이 기록",
  description: "반려동물별 미용 기록, 다음 미용 추천일, 자주 가는 미용실",
  robots: { index: false },
};

export default function PetProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
