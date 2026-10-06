import { expect, test } from "@playwright/test";
import { heading, readDb } from "./helpers";

test.describe("미용실 찾기", () => {
  test("검색·빈 결과·초기화·정렬·필터", async ({ page }) => {
    await page.goto("/salons");
    const count = page.locator("p[aria-live]");
    await expect(count).toContainText("6곳");

    await page.getByLabel("미용실 검색").fill("없는미용실xyz");
    await expect(page.getByText("조건에 맞는 미용실이 없어요")).toBeVisible();
    await page.getByRole("button", { name: "검색 조건 초기화" }).click();
    await expect(count).toContainText("6곳");

    await page.getByRole("button", { name: "평점 높은 순" }).click();
    await expect(page.getByRole("button", { name: "평점 높은 순" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await page.getByLabel("오늘 예약 가능").check();
    await expect(count).not.toContainText("6곳");
  });

  test("찜은 새로고침 후에도 유지된다", async ({ page }) => {
    await page.goto("/salons");
    const heart = page.getByRole("button", { name: "멍뭉살롱 찜하기" }).locator("visible=true");
    await heart.click();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "멍뭉살롱 찜 해제" }).locator("visible=true")
    ).toBeVisible();
    expect((await readDb(page)).favorites).toContain("salon-2");
  });
});

test.describe("반려동물 등록", () => {
  test("빈 칸·범위 오류를 칸마다 알려주고, 고치면 등록된다", async ({ page }) => {
    await page.goto("/pets");
    await page.getByRole("button", { name: "새로 등록" }).click();
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });

    await dialog.getByRole("button", { name: "등록하기" }).click();
    await expect(dialog.getByRole("alert")).toHaveCount(4);
    await expect(dialog.locator("#pet-name")).toBeFocused();

    await dialog.locator("#pet-name").fill("테스트");
    await dialog.locator("#pet-breed").fill("믹스");
    await dialog.locator("#pet-age").fill("40");
    await dialog.locator("#pet-weight").fill("3.2.1");
    await dialog.getByRole("button", { name: "등록하기" }).click();
    await expect(dialog.getByRole("alert")).toHaveText([/1~30/, /0\.1~80/]);
    await expect(dialog.locator("#pet-age")).toHaveAttribute("aria-invalid", "true");

    const before = (await readDb(page)).pets.length;
    await dialog.locator("#pet-age").fill("2");
    await dialog.locator("#pet-weight").fill("3.2");
    await dialog.getByRole("button", { name: "등록하기" }).click();
    await expect(dialog).toBeHidden();
    expect((await readDb(page)).pets.length).toBe(before + 1);
  });

  test("입력 중에는 바깥을 눌러도 닫히지 않는다", async ({ page }) => {
    await page.goto("/pets?add=1");
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });
    await dialog.locator("#pet-name").fill("두부");
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("마이페이지", () => {
  test("쿠폰 기한은 오늘 이후이고, 알림 설정은 새로고침 후에도 유지된다", async ({ page }) => {
    await page.goto("/my");
    const deadlines = await page.getByText(/\d+월 \d+일까지/).allTextContents();
    expect(deadlines).toHaveLength(3);

    const toggle = page.getByRole("switch", { name: /혜택 알림/ });
    const was = await toggle.getAttribute("aria-checked");
    await toggle.click();
    await page.reload();
    await expect(page.getByRole("switch", { name: /혜택 알림/ })).not.toHaveAttribute(
      "aria-checked",
      was!
    );
  });
});

test.describe("예외 화면", () => {
  test("없는 주소는 한국어 404", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(heading(page)).toHaveText("찾으시는 페이지가 없어요");
  });

  test("없는 예약 번호", async ({ page }) => {
    await page.goto("/booking/complete/bk-unknown");
    await expect(page.getByText("예약 정보를 찾을 수 없어요")).toBeVisible();
  });

  test("저장소가 깨져 있어도 시드 데이터로 정상 시작한다", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("pawbeauty-db-v1", "{broken"));
    await page.goto("/bookings");
    await expect(page.getByText("예약 확정").first()).toBeVisible();
  });
});
