import { describe, expect, it } from "vitest";
import { getSalonById, getServiceById, SALONS, SERVICES } from "@/lib/data";
import { dDayLabel, formatDateKo, formatDateShortKo, formatWon, toDateKey } from "@/lib/format";
import { BASE_SERVICE_PRICE, priceAt } from "@/lib/pricing";

describe("priceAt — 미용실별 가격", () => {
  const basic = getServiceById("svc-1")!;

  it("기본 미용 가격은 그 미용실의 priceFrom과 같다", () => {
    expect(basic.price).toBe(BASE_SERVICE_PRICE);
    for (const salon of SALONS) expect(priceAt(basic, salon)).toBe(salon.priceFrom);
  });

  it("미용실을 고르기 전에는 서비스 기준가", () => {
    expect(priceAt(basic, null)).toBe(basic.price);
  });

  it("항상 1,000원 단위", () => {
    for (const service of SERVICES)
      for (const salon of SALONS) expect(priceAt(service, salon) % 1000).toBe(0);
  });

  it("가격대가 높은 미용실일수록 비싸다", () => {
    const spa = getServiceById("svc-3")!;
    expect(priceAt(spa, getSalonById("salon-4"))).toBeGreaterThan(
      priceAt(spa, getSalonById("salon-5"))
    );
  });
});

describe("format", () => {
  it("toDateKey는 로컬 날짜 기준 YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2030, 0, 5, 23, 59))).toBe("2030-01-05");
  });

  it("날짜 표시", () => {
    expect(formatDateKo("2030-01-10")).toBe("2030. 1. 10 (목)");
    expect(formatDateShortKo("2030-01-10")).toBe("1월 10일 (목)");
  });

  it("금액 표시", () => {
    expect(formatWon(58500)).toBe("₩ 58,500");
  });

  it("D-day: 오늘·내일·D-n, 지난 날은 null (시각과 무관하게 날짜로 계산)", () => {
    const now = new Date(2030, 0, 10, 23, 30);
    expect(dDayLabel("2030-01-10", now)).toBe("오늘");
    expect(dDayLabel("2030-01-11", now)).toBe("내일");
    expect(dDayLabel("2030-01-17", now)).toBe("D-7");
    expect(dDayLabel("2030-01-09", now)).toBeNull();
  });

  it("D-day는 월·연도 경계를 넘어도 정확하다", () => {
    expect(dDayLabel("2030-01-01", new Date(2029, 11, 31, 9))).toBe("내일");
    expect(dDayLabel("2030-03-01", new Date(2030, 1, 28, 9))).toBe("내일");
  });
});
