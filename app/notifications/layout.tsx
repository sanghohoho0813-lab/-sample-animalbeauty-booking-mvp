import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "알림",
  description: "예약 확정·방문 안내·후기 요청·미용 시기 알림",
  robots: { index: false },
};

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return children;
}
