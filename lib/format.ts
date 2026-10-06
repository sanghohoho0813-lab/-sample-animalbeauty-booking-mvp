export function formatWon(value: number): string {
  return `₩ ${value.toLocaleString("ko-KR")}`;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateKo(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}. ${m}. ${d} (${WEEKDAYS_KO[date.getDay()]})`;
}

export function formatDateShortKo(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 (${WEEKDAYS_KO[date.getDay()]})`;
}

/** 오늘 기준 남은 날짜 — "오늘" / "내일" / "D-n" (지난 날짜는 null) */
export function dDayLabel(dateKey: string, now: Date = new Date()): string | null {
  const [y, m, d] = dateKey.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((target - today) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  return `D-${days}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Deterministic hash → used for stable pseudo-random slot availability. */
export function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}
