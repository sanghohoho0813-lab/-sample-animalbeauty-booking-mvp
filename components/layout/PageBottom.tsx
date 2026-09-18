"use client";

import { usePathname } from "next/navigation";
import SampleBridgeCTA from "@/components/brand/SampleBridgeCTA";
import Footer from "./Footer";

/**
 * 모든 페이지 하단에 공통으로 붙는 영역 (브릿지 CTA + 푸터).
 *
 * 예약 진행 단계(/booking)는 하단 고정 CTA가 있는 작업 중 화면이라 제외한다.
 * 예약을 끝낸 /booking/complete 화면은 전환 시점이라 그대로 노출한다.
 */
export default function PageBottom() {
  const pathname = usePathname();
  const isBookingFlow =
    pathname === "/booking" || pathname.startsWith("/booking?");

  if (isBookingFlow) return null;

  return (
    // 모바일 하단 네비게이션에 가리지 않도록 아래 여백을 둔다
    <div className="pb-24 lg:pb-0">
      <SampleBridgeCTA />
      <Footer />
    </div>
  );
}
