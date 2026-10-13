import { expect, type Page } from "@playwright/test";

export const DRAFT_KEY = "pawbeauty-booking-draft-v1";
export const DB_KEY = "pawbeauty-db-v1";

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

/** 오늘로부터 n일 뒤 YYYY-MM-DD (브라우저 시간대 기준과 같게 로컬 날짜로 계산) */
export function dateKeyFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

export interface Draft {
  petId: string | null;
  serviceId: string | null;
  salonId: string | null;
  groomerId: string | null;
  date: string | null;
  time: string | null;
  couponId: string;
  requestTags: string[];
  requestMemo: string;
  requestPetId: string | null;
}

export const EMPTY_DRAFT: Draft = {
  petId: null,
  serviceId: null,
  salonId: null,
  groomerId: null,
  date: null,
  time: null,
  couponId: "auto",
  requestTags: [],
  requestMemo: "",
  requestPetId: null,
};

/** 예약 선택값을 미리 넣어 특정 단계부터 시작한다 */
export async function openBookingAt(page: Page, step: number, draft: Partial<Draft>) {
  await page.goto("/");
  await page.evaluate(([key, value]) => sessionStorage.setItem(key, value), [
    DRAFT_KEY,
    JSON.stringify({ ...EMPTY_DRAFT, ...draft }),
  ] as const);
  await page.goto(`/booking?step=${step}`);
  await expect(page.locator("h1")).toBeVisible();
}

export const readDraft = (page: Page) =>
  page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "{}") as Draft, DRAFT_KEY);

/** 앱이 저장소를 초기화한 뒤의 데이터 (첫 방문이면 시드가 채워질 때까지 기다린다) */
export const readDb = async (page: Page) => {
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, DB_KEY);
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), DB_KEY) as Promise<{
    pets: { id: string; name: string }[];
    bookings: {
      id: string;
      petId: string;
      status: string;
      date: string;
      time: string;
      total: number;
    }[];
    favorites: string[];
  }>;
};

/**
 * 달력에서 오늘로부터 n일 뒤부터 처음으로 고를 수 있는 날짜를 고른다
 * (정기 휴무·마감일은 건너뛰고, 필요하면 다음 달로 넘긴다)
 */
export async function pickDate(page: Page, offset: number) {
  for (let i = offset; i < offset + 14; i += 1) {
    const key = dateKeyFromToday(i);
    let day = page.locator(`[data-date="${key}"]`);
    if (!(await day.count())) {
      await page.getByRole("button", { name: "다음 달" }).click();
      day = page.locator(`[data-date="${key}"]`);
    }
    if (await day.isEnabled()) {
      await day.click();
      return key;
    }
  }
  throw new Error("고를 수 있는 날짜가 없어요");
}

/** 오늘로부터 며칠 뒤인지 */
export const offsetOf = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((new Date(y, m - 1, d).getTime() - today) / 86_400_000);
};

/** 'YYYY-MM-DD' → 화면 표기 'M월 D일' */
export const shortDate = (key: string) => {
  const [, m, d] = key.split("-").map(Number);
  return `${m}월 ${d}일`;
};

/** 열려 있는 첫 시간을 고른다 */
export async function pickFirstOpenTime(page: Page) {
  const slot = page
    .getByRole("group", { name: /시간$/ })
    .getByRole("button", { disabled: false })
    .first();
  const time = (await slot.textContent())?.trim() ?? "";
  await slot.click();
  return time;
}

export const heading = (page: Page) => page.locator("h1").first();
