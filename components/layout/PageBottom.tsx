"use client";

import { usePathname } from "next/navigation";
import SampleBridgeCTA from "@/components/brand/SampleBridgeCTA";
import { isBookingFlow } from "@/lib/routes";
import Footer from "./Footer";

/**
 * 모든 페이지 하단에 공통으로 붙는 영역 (브릿지 CTA + 푸터).
 * 예약 진행 단계(/booking)만 제외하고, 예약 완료 화면에서는 그대로 노출한다.
 */
export default function PageBottom() {
  const pathname = usePathname();
  if (isBookingFlow(pathname)) return null;

  return (
    // 모바일 하단 네비게이션에 가리지 않도록 아래 여백을 둔다
    <div className="pb-24 lg:pb-0">
      <SampleBridgeCTA />
      <Footer />
    </div>
  );
}
