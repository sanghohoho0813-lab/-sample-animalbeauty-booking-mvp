import { describe, expect, it } from "vitest";
import { SEED_PETS } from "@/lib/data";
import { seedBookings } from "@/lib/db-core";
import { toDateKey } from "@/lib/format";
import {
  buildNotifications,
  NOTIFICATION_LIMIT,
  noticeGroup,
  noticeTime,
  unreadCount,
} from "@/lib/notifications";
import type { Booking, Review } from "@/lib/types";

const NOW = new Date(2030, 0, 10, 12, 0); // 목요일 정오
const base = seedBookings(NOW);
const build = (bookings: Booking[], now = NOW, reviews: Review[] = []) =>
  buildNotifications({ pets: SEED_PETS, bookings, reviews, now });
const kinds = (list: ReturnType<typeof build>) => list.map((n) => n.id);

/** 오늘로부터 n일 뒤 방문하는 예정 예약 (사흘 전에 예약) */
const upcomingIn = (days: number, time = "15:00"): Booking => ({
  ...base[0],
  id: "bk-test",
  date: toDateKey(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days)),
  time,
  status: "confirmed",
  createdAt: new Date(2030, 0, 7, 10, 0).toISOString(),
});

describe("알림 만들기", () => {
  it("시드 예약 — 예약 확정, 취소, 후기 안 쓴 이용 완료만 후기 요청", () => {
    const ids = kinds(build(base));
    expect(ids).toEqual(expect.arrayContaining(base.map((b) => `confirmed-${b.id}`)));
    expect(ids).toContain("cancelled-bk-seed-6");
    expect(ids).toContain("review-bk-seed-4");
    expect(ids).not.toContain("review-bk-seed-3"); // 이미 후기를 쓴 예약
    expect(ids).not.toContain("review-bk-seed-5");
  });

  it("최신순이고, 아직 오지 않은 시각의 알림은 만들지 않는다", () => {
    const list = build(base);
    const times = list.map((n) => n.at);
    expect([...times].sort().reverse()).toEqual(times);
    expect(list.every((n) => new Date(n.at) <= NOW)).toBe(true);
  });

  it("방문 전날 저녁 6시부터 '내일 방문' 안내가 생긴다", () => {
    const b = upcomingIn(1);
    expect(kinds(build([b], new Date(2030, 0, 10, 17, 59)))).not.toContain(
      `reminder-bk-test-${b.date}`
    );
    expect(kinds(build([b], new Date(2030, 0, 10, 18, 0)))).toContain(`reminder-bk-test-${b.date}`);
  });

  it("방문 당일 아침 8시에 '오늘 방문' 알림", () => {
    const b = upcomingIn(0, "17:00");
    const ids = kinds(build([b], new Date(2030, 0, 10, 9, 0)));
    expect(ids).toContain(`today-bk-test-${b.date}`);
    expect(build([b], new Date(2030, 0, 10, 9, 0)).find((n) => n.kind === "today")?.title).toBe(
      "오늘 17:00, 콩이 미용이에요"
    );
  });

  it("후기를 쓰면 후기 요청 알림이 사라진다", () => {
    const review = { bookingId: "bk-seed-4" } as Review;
    expect(kinds(build(base, NOW, [review]))).not.toContain("review-bk-seed-4");
  });

  it("일정을 바꾸면 변경 알림이 생기고, 확정 알림에는 처음 시간이 남는다", () => {
    const moved: Booking = {
      ...upcomingIn(5),
      previous: { date: "2030-01-12", time: "10:00" },
      rescheduledAt: new Date(2030, 0, 9, 9, 0).toISOString(),
    };
    const list = build([moved]);
    expect(list.find((n) => n.kind === "changed")?.body).toContain("1월 12일 (토) 10:00 →");
    expect(list.find((n) => n.kind === "confirmed")?.body).toContain("1월 12일 (토) 10:00");
  });

  it("다가오는 예약이 없는 아이는 다음 미용 추천일 일주일 전부터 알린다", () => {
    const longAgo: Booking = {
      ...base[3],
      id: "bk-old",
      petId: "pet-3",
      date: "2029-11-20",
      status: "completed",
      reviewed: true,
    };
    const ids = kinds(build([longAgo]));
    expect(ids.some((id) => id.startsWith("due-pet-3-"))).toBe(true);
    // 예정된 예약이 있으면 알리지 않는다
    const withUpcoming = [longAgo, { ...upcomingIn(4), petId: "pet-3" }];
    expect(kinds(build(withUpcoming)).some((id) => id.startsWith("due-pet-3-"))).toBe(false);
  });

  it(`많아도 최근 ${NOTIFICATION_LIMIT}개까지만`, () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      ...base[4],
      id: `bk-${i}`,
      createdAt: new Date(2029, 11, 1 + (i % 28)).toISOString(),
    }));
    expect(build(many)).toHaveLength(NOTIFICATION_LIMIT);
  });
});

describe("읽음·시각 표시", () => {
  const list = build(base);
  it("마지막으로 연 시각 이후의 알림만 새 알림", () => {
    expect(unreadCount(list, null)).toBe(list.length);
    expect(unreadCount(list, NOW.toISOString())).toBe(0);
    const justBeforeNewest = new Date(new Date(list[0].at).getTime() - 1).toISOString();
    expect(unreadCount(list, justBeforeNewest)).toBe(
      list.filter((n) => n.at === list[0].at).length
    );
  });

  it("방금 · 분 · 시간 · 어제 · 며칠 전 · 날짜", () => {
    const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
    expect(noticeTime(ago(20_000), NOW)).toBe("방금");
    expect(noticeTime(ago(5 * 60_000), NOW)).toBe("5분 전");
    expect(noticeTime(ago(3 * 3_600_000), NOW)).toBe("3시간 전");
    expect(noticeTime(new Date(2030, 0, 9, 20, 0).toISOString(), NOW)).toBe("어제");
    expect(noticeTime(new Date(2030, 0, 6, 9, 0).toISOString(), NOW)).toBe("4일 전");
    expect(noticeTime(new Date(2029, 11, 25, 9, 0).toISOString(), NOW)).toBe("12월 25일");
    expect(noticeGroup(ago(60_000), NOW)).toBe("오늘");
    expect(noticeGroup(new Date(2030, 0, 6).toISOString(), NOW)).toBe("최근 7일");
    expect(noticeGroup(new Date(2029, 11, 25).toISOString(), NOW)).toBe("이전 알림");
  });
});
