import { DEMO_USER } from "./data";
import type { Review, ReviewKeyword, Salon } from "./types";

/** 다른 사용자의 이름은 가운데를 가린다 (박서준 → 박*준, 김팀 → 김*) */
export function maskName(name: string): string {
  if (name === DEMO_USER.name) return name;
  if (name.length <= 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name.at(-1)}`;
}

/** 후기 날짜를 '3일 전'처럼 */
export function relativeDay(dateKey: string, now: Date): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(y, m - 1, d).getTime()) /
      86_400_000
  );
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

/** 매장 후기 요약 키워드 — 누적 통계에 내가 남긴 후기의 키워드를 더한다 */
export function keywordSummary(salon: Salon, myReviews: Review[]): ReviewKeyword[] {
  const counts = new Map(salon.reviewKeywords.map((k) => [k.label, k.count]));
  for (const r of myReviews) {
    if (r.salonId !== salon.id) continue;
    for (const k of r.keywords ?? []) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
