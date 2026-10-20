import { expect, test } from "@playwright/test";
import { DB_KEY, heading, readDb, readDraft } from "./helpers";

test.describe("알림함", () => {
  test("새 알림 수를 보여주고, 알림함을 열면 읽음이 된다", async ({ page }) => {
    await page.goto("/");
    const bell = page.getByRole("link", { name: /^알림, 새 알림 \d+개$/ });
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(heading(page)).toHaveText("알림");
    await expect(page.getByText(/새 알림 \d+개/)).toBeVisible();
    // 후기를 안 쓴 이용 완료 예약 → 후기 요청
    const reviewAsk = page.getByRole("link", { name: /콩이 미용은 어땠나요\?/ });
    await expect(reviewAsk).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "알림", exact: true })).toBeVisible();

    // 알림을 누르면 해당 예약으로
    await page.goto("/notifications");
    await page.getByRole("link", { name: /콩이 미용은 어땠나요\?/ }).click();
    await expect(page).toHaveURL(/\/bookings\/bk-seed-4$/);
  });

  test("후기를 쓰면 후기 요청 알림이 사라지고, 새 예약은 새 알림으로 온다", async ({ page }) => {
    await page.goto("/bookings/bk-seed-4");
    await page.getByRole("button", { name: "후기 작성" }).click();
    const dialog = page.getByRole("dialog", { name: "후기 작성" });
    await dialog.getByRole("button", { name: "꼼꼼해요" }).click();
    await dialog.getByRole("button", { name: "후기 등록하기" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/notifications");
    await expect(page.getByRole("link", { name: /예약이 확정됐어요/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /콩이 미용은 어땠나요\?/ })).toHaveCount(0);

    // 다른 탭에서 방금 예약이 생겼다
    await page.goto("/");
    await readDb(page);
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key)!);
      db.bookings.push({ ...db.bookings[0], id: "bk-new", createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(db));
    }, DB_KEY);
    await page.reload();
    await expect(page.getByRole("link", { name: "알림, 새 알림 1개" })).toBeVisible();
  });
});

test.describe("우리 아이 기록", () => {
  test("목록에서 아이 기록으로 — 통계·다가오는 예약·미용 기록·같은 조건 재예약", async ({
    page,
  }) => {
    await page.goto("/pets");
    await page.getByRole("link", { name: "콩이 미용 기록 보기" }).click();
    await expect(heading(page)).toHaveText("콩이");
    const stats = page.locator("dl").first();
    await expect(stats).toContainText("미용 횟수");
    await expect(stats).toContainText("1회");
    await expect(page.getByRole("heading", { name: "다가오는 예약" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "미용 기록" })).toBeVisible();
    await expect(page.getByText("후기를 기다리고 있어요")).toBeVisible();

    await page.getByRole("button", { name: "같은 조건으로 다시 예약" }).click();
    await expect(heading(page)).toHaveText("언제 방문할까요?");
    expect(await readDraft(page)).toMatchObject({ petId: "pet-1", salonId: "salon-1" });
  });

  test("아이 기록에서 정보를 고치고, 삭제하면 목록으로 돌아간다", async ({ page }) => {
    await page.goto("/");
    await readDb(page);
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key)!);
      db.pets.push({
        id: "pet-new",
        name: "두부",
        species: "dog",
        breed: "비숑",
        age: 2,
        weight: 5,
        emoji: "🐩",
      });
      localStorage.setItem(key, JSON.stringify(db));
    }, DB_KEY);
    await page.goto("/pets/pet-new");
    await expect(heading(page)).toHaveText("두부");
    await expect(page.getByText("아직 미용 기록이 없어요")).toBeVisible();

    await page.getByRole("button", { name: "두부 정보 수정" }).click();
    const dialog = page.getByRole("dialog", { name: "두부 정보 수정" });
    await dialog.locator("#pet-weight").fill("5.5");
    await dialog.getByRole("button", { name: "저장하기" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("비숑 · 2살 · 5.5kg")).toBeVisible();

    await page.getByRole("button", { name: "두부 정보 수정" }).click();
    await page.getByRole("button", { name: "이 반려동물 삭제" }).click();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page).toHaveURL(/\/pets$/);
    expect((await readDb(page)).pets.some((p) => p.id === "pet-new")).toBe(false);
  });

  test("없는 아이 주소", async ({ page }) => {
    await page.goto("/pets/no-such-pet");
    await expect(
      page.getByRole("heading", { name: "반려동물 정보를 찾을 수 없어요" })
    ).toBeVisible();
  });
});

test.describe("미용실 필터·검색 주소", () => {
  test("필터 시트 — 고르는 동안 결과 수, 적용하면 목록·배지에 반영, 해제", async ({ page }) => {
    await page.goto("/salons");
    const count = page.locator("p[aria-live]");
    await expect(count).toContainText("6곳");

    await page.getByRole("button", { name: "필터" }).click();
    const sheet = page.getByRole("dialog", { name: "미용실 필터" });
    await sheet.getByRole("button", { name: "주차 가능" }).click();
    const apply = sheet.getByRole("button", { name: /곳 보기$/ });
    const n = Number((await apply.textContent())!.match(/(\d+)곳/)![1]);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(6);
    await apply.click();
    await expect(sheet).toBeHidden();
    await expect(count).toContainText(`${n}곳`);
    await expect(page.getByRole("button", { name: "필터, 1개 적용 중" })).toBeVisible();

    // 조건이 너무 좁으면 적용 버튼이 막힌다
    await page.getByRole("button", { name: "필터, 1개 적용 중" }).click();
    await sheet.getByRole("radio", { name: "4만 원 이하" }).click();
    await sheet.getByRole("button", { name: "고양이 전용 공간" }).click();
    await expect(sheet.getByRole("button", { name: "조건에 맞는 곳이 없어요" })).toBeDisabled();
    await sheet.getByRole("button", { name: "초기화" }).click();
    await expect(sheet.getByRole("button", { name: "6곳 보기" })).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    // 닫기만 하면 적용 중인 필터는 그대로
    await expect(count).toContainText(`${n}곳`);

    await page.getByRole("button", { name: "필터 해제" }).click();
    await expect(count).toContainText("6곳");
  });

  test("주소의 검색어로 바로 찾고, 헤더 검색 버튼은 검색창으로 데려간다", async ({ page }) => {
    await page.goto("/salons?q=" + encodeURIComponent("대형견"));
    await expect(page.getByLabel("미용실 검색")).toHaveValue("대형견");
    await expect(page.locator("p[aria-live]")).not.toContainText("6곳");

    await page.goto("/");
    await page.getByRole("link", { name: "검색하기" }).click();
    await expect(page).toHaveURL(/\/salons\?focus=1$/);
    await expect(page.getByLabel("미용실 검색")).toBeFocused();
  });
});

test.describe("예약 내역 보기", () => {
  test("지난 내역 — 후기 대기 수, 달별 묶음, 아이별 보기", async ({ page }) => {
    await page.goto("/bookings");
    const pastTab = page.getByRole("tab", { name: /지난 내역/ });
    await expect(pastTab).toContainText("후기 1");
    await pastTab.click();
    await expect(page.getByRole("heading", { name: /^\d{4}년 \d{1,2}월/ }).first()).toBeVisible();

    await page.getByRole("button", { name: "몽이", exact: true }).click();
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
    for (const text of await cards.allTextContents()) expect(text).toContain("몽이");

    // 예정된 예약 탭에도 같은 아이 기준이 유지된다
    await page.getByRole("tab", { name: /예정된 예약/ }).click();
    for (const text of await page.locator("article").allTextContents()) {
      expect(text).toContain("몽이");
    }
  });
});
