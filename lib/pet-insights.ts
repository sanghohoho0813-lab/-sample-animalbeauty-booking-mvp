import { getGroomerById, getSalonById } from "./data";
import type { Booking, Groomer, Salon } from "./types";

/**
 * 한 아이의 이용 패턴 — 자주 가는 미용실·미용사, 실제 미용 간격.
 * 이용 완료된 예약만 센다 (취소·예정 제외).
 */
export function petInsights(petId: string, bookings: Booking[]) {
  const done = bookings
    .filter((b) => b.petId === petId && b.status === "completed")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const mostFrequent = (list: Booking[], key: (b: Booking) => string) => {
    const counts = new Map<string, { count: number; lastAt: string }>();
    for (const b of list) {
      const k = key(b);
      const prev = counts.get(k);
      counts.set(k, { count: (prev?.count ?? 0) + 1, lastAt: `${b.date}${b.time}` });
    }
    // 횟수가 같으면 최근에 간 곳
    return [...counts.entries()].sort(
      (a, b) => b[1].count - a[1].count || b[1].lastAt.localeCompare(a[1].lastAt)
    )[0];
  };

  const salonTop = mostFrequent(done, (b) => b.salonId);
  // 자주 가는 미용실 안에서 가장 많이 맡긴 미용사, 그 미용실의 가장 최근 이용
  const atSalon = salonTop ? done.filter((b) => b.salonId === salonTop[0]) : [];
  const groomerTop = mostFrequent(atSalon, (b) => b.groomerId);
  const salon = salonTop ? getSalonById(salonTop[0]) : null;
  const groomer = groomerTop ? getGroomerById(groomerTop[0]) : null;
  const lastAtFavorite = atSalon.at(-1) ?? null;

  // 두 번 이상 받았을 때만 실제 평균 간격(일)
  let averageCycleDays: number | null = null;
  if (done.length >= 2) {
    const toTime = (b: Booking) => new Date(`${b.date}T00:00:00`).getTime();
    const span = toTime(done[done.length - 1]) - toTime(done[0]);
    averageCycleDays = Math.round(span / 86_400_000 / (done.length - 1));
  }

  return {
    visits: done.length,
    favoriteSalon: salon && salonTop ? { salon: salon as Salon, count: salonTop[1].count } : null,
    favoriteGroomer: groomer ? (groomer as Groomer) : null,
    /** '다시 예약'에 쓸 예약 — 자주 가는 미용실에서의 가장 최근 이용 */
    lastAtFavorite,
    averageCycleDays,
  };
}
