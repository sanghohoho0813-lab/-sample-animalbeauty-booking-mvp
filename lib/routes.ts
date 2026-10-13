/**
 * 예약 진행 단계(/booking) 여부.
 * 이 화면은 하단 고정 CTA가 있는 작업 중 화면이라 하단 네비·브릿지 CTA·푸터를 숨긴다.
 * 예약을 마친 /booking/complete/* 는 일반 화면으로 취급한다.
 */
export function isBookingFlow(pathname: string): boolean {
  return pathname === "/booking";
}

/** 미용실 상세 (/salons/[id]) — 하단에 '예약하기' 고정 버튼이 있다 */
export function isSalonDetail(pathname: string): boolean {
  return /^\/salons\/[^/]+$/.test(pathname);
}

/** 자체 하단 고정 버튼이 있어 하단 탭 메뉴를 숨기는 화면 */
export function hidesTabBar(pathname: string): boolean {
  return isBookingFlow(pathname) || isSalonDetail(pathname);
}
