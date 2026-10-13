"use client";

import { useEffect, useState } from "react";

/**
 * 브라우저의 현재 시각. 서버 렌더·첫 렌더에서는 null이라
 * 날짜에 따라 달라지는 값(D-day, 예약 가능 시간 등)이 하이드레이션과 어긋나지 않는다.
 * 1분마다 갱신해 화면을 오래 열어둬도 지난 시간이 예약 가능으로 남지 않는다.
 */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
