import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openBookingAt, pickDate, pickFirstOpenTime } from "./helpers";

const scan = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  // 실패 시 어떤 규칙·요소인지 바로 보이게
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
  ).toEqual([]);
};

const PAGES = [
  "/",
  "/salons",
  "/salons/salon-1",
  "/bookings",
  "/bookings/bk-seed-1",
  "/bookings/bk-seed-4",
  "/favorites",
  "/pets",
  "/pets/pet-1",
  "/notifications",
  "/my",
  "/help",
  "/no-such-page",
];

test.describe("접근성 (axe · WCAG 2.1 AA)", () => {
  for (const path of PAGES) {
    test(`페이지 ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await scan(page);
    });
  }

  test("예약 각 단계", async ({ page }) => {
    const draft = {
      petId: "pet-1",
      serviceId: "svc-1",
      salonId: "salon-1",
      groomerId: "grm-1",
      date: null,
      time: null,
    };
    for (const step of [0, 1, 2, 3, 4]) {
      await openBookingAt(page, step, draft);
      await scan(page);
    }
    // 시간까지 고른 뒤 확인 단계(요청사항·쿠폰)
    await pickDate(page, 3);
    await pickFirstOpenTime(page);
    await scan(page);
    await page.getByRole("button", { name: "다음" }).last().click();
    await expect(page.getByRole("heading", { name: "쿠폰" })).toBeVisible();
    await scan(page);
  });

  test("대화상자 (반려동물 등록 · 예약 취소 · 일정 변경 · 후기 · 미용실 필터)", async ({
    page,
  }) => {
    await page.goto("/pets?add=1");
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);

    await page.goto("/bookings/bk-seed-1");
    await page.getByRole("button", { name: "예약 취소" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "일정 변경" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);
    await page.keyboard.press("Escape");

    await page.goto("/bookings/bk-seed-4");
    await page.getByRole("button", { name: "후기 작성" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await scan(page);

    await page.goto("/salons");
    await page.getByRole("button", { name: "필터" }).click();
    await expect(page.getByRole("dialog", { name: "미용실 필터" })).toBeVisible();
    await scan(page);
  });
});

test.describe("키보드 사용", () => {
  test.skip(({ isMobile }) => isMobile, "키보드 시나리오는 데스크톱에서만");

  test("본문으로 건너뛰기 링크", async ({ page }) => {
    await page.goto("/salons");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "본문으로 건너뛰기" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });

  test("대화상자는 포커스를 가두고, 닫으면 연 버튼으로 돌아간다", async ({ page }) => {
    await page.goto("/pets");
    const opener = page.getByRole("button", { name: "새로 등록" });
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });
    await expect(dialog.locator("#pet-name")).toBeFocused();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });

  test("달력은 방향키로 날짜를 옮기고 Enter로 고른다", async ({ page }) => {
    await openBookingAt(page, 4, {
      petId: "pet-1",
      serviceId: "svc-1",
      salonId: "salon-1",
      groomerId: "grm-1",
    });
    const first = page.locator("[data-date][tabindex='0']");
    await first.focus();
    const start = await first.getAttribute("data-date");
    await page.keyboard.press("ArrowDown");
    const focused = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.date);
    expect(focused && focused > start!).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.locator(`[data-date="${focused}"]`)).toHaveAttribute("aria-pressed", "true");
  });
});
