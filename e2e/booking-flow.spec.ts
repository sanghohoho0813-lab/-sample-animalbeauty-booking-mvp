import { expect, test } from "@playwright/test";
import { heading, offsetOf, pickDate, pickFirstOpenTime, readDb, shortDate } from "./helpers";

test.describe("예약 전체 흐름", () => {
  test("홈 → 서비스 → 예약 확정 → 상세 → 취소 → 후기 → 다시 예약", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/");

    // 홈 서비스 카드로 진입하면 서비스가 미리 선택된다
    await page
      .locator('a[href^="/booking?service="]')
      .filter({ hasText: "기본 미용" })
      .first()
      .click();
    await expect(heading(page)).toHaveText("어떤 아이가 미용을 받나요?");

    // 하나만 고르는 단계는 고르면 바로 다음 단계로 넘어간다 (미리 고른 서비스 단계는 건너뛴다)
    await page.getByRole("button", { name: /콩이/ }).click();
    await expect(heading(page)).toHaveText("어느 미용실이 좋을까요?");
    await page
      .getByRole("button", { name: "이전 단계" })
      .or(page.getByRole("button", { name: "이전" }))
      .last()
      .click();
    await expect(heading(page)).toHaveText("콩이에게 어떤 관리가 필요할까요?");
    await expect(page.getByRole("button", { name: /기본 미용/, pressed: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /고양이 미용/ })).toBeDisabled();
    await page.getByRole("button", { name: "다음" }).last().click();

    await page.getByRole("button", { name: /살롱 드 포우 선택/ }).click();
    await expect(heading(page)).toHaveText("누구에게 맡길까요?");
    await page.getByRole("button", { name: /이수진/ }).click();
    await expect(heading(page)).toHaveText("언제 방문할까요?");

    // 날짜를 바꾸면 고른 시간은 초기화된다
    const first = await pickDate(page, 6);
    await pickFirstOpenTime(page);
    const dateKey = await pickDate(page, offsetOf(first) + 1);
    await expect(
      page.getByRole("group", { name: /시간$/ }).getByRole("button", { pressed: true })
    ).toHaveCount(0);
    const time = await pickFirstOpenTime(page);
    await page.getByRole("button", { name: "다음" }).last().click();

    await expect(heading(page)).toHaveText("예약 내용을 확인해주세요");
    const before = (await readDb(page)).bookings.length;

    // 연타(더블클릭)해도 예약은 한 건만 생긴다
    await page.getByRole("button", { name: "예약 확정하기" }).last().dblclick();
    await page.waitForURL(/\/booking\/complete\//);
    await expect(heading(page)).toHaveText("예약이 확정되었어요");
    expect((await readDb(page)).bookings.length).toBe(before + 1);

    // 새로고침해도 완료 화면 유지, 뒤로가기로 확인 단계가 다시 열리지 않는다
    await page.reload();
    await expect(heading(page)).toHaveText("예약이 확정되었어요");
    const completeUrl = page.url();
    await page.goBack();
    await expect(heading(page)).not.toHaveText("예약 내용을 확인해주세요");
    await page.goto(completeUrl);

    // 예약 상세 — 방문 전 준비·일정 관리가 바로 보인다
    await page.getByRole("link", { name: "예약 내역 보기" }).click();
    await expect(heading(page)).toContainText(time);
    await expect(page.getByRole("heading", { name: "방문 전 준비" })).toBeVisible();

    // 취소 → 지난 내역으로 이동, 취소된 예약에는 후기 버튼이 없다
    await page.getByRole("button", { name: "예약 취소" }).click();
    await page
      .getByRole("dialog", { name: "예약 취소 확인" })
      .getByRole("button", { name: "예약 취소" })
      .click();
    await expect(page.getByText("취소된 예약이에요")).toBeVisible();
    await page.goto("/bookings");
    await page.getByRole("tab", { name: /지난 내역/ }).click();
    const cancelled = page
      .locator("article")
      .filter({ hasText: "취소됨" })
      .filter({ hasText: `${shortDate(dateKey)}` })
      .filter({ hasText: time });
    await expect(cancelled).toHaveCount(1);
    await expect(cancelled.getByRole("button", { name: "후기 작성" })).toHaveCount(0);

    // 이용 완료된 예약에 후기 (키워드 + 한 줄) → 홈 최근 후기에 반영
    const text = `E2E 후기 ${Date.now()}`;
    await page.getByRole("button", { name: "후기 작성" }).first().click();
    const dialog = page.getByRole("dialog", { name: "후기 작성" });
    await expect(dialog.getByRole("button", { name: "후기 등록하기" })).toBeDisabled();
    await dialog.getByRole("button", { name: "꼼꼼해요" }).click();
    await dialog.locator("textarea").fill(text);
    await dialog.getByRole("button", { name: "후기 등록하기" }).click();
    await expect(dialog).toBeHidden();
    await page.goto("/");
    await expect(page.getByText(text)).toBeVisible();

    // 다시 예약 → 날짜 단계로 바로
    await page.goto("/bookings");
    await page.getByRole("tab", { name: /지난 내역/ }).click();
    await page.getByRole("button", { name: "다시 예약" }).first().click();
    await expect(heading(page)).toHaveText("언제 방문할까요?");
  });

  test("홈: 다가오는 예약과 아이별 바로 예약", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /남았어요|있어요|때가 됐어요|예약해요/
    );
    await page.getByRole("link", { name: "보리 미용 예약하기" }).click();
    await expect(heading(page)).toHaveText("보리에게 어떤 관리가 필요할까요?");
  });
});
