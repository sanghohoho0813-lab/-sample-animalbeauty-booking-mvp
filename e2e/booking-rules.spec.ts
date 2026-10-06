import { expect, test } from "@playwright/test";
import { dateKeyFromToday, heading, openBookingAt, readDb, readDraft } from "./helpers";

test.describe("예약 규칙과 예외 상황", () => {
  test("고양이 전문 미용실은 강아지가 고를 수 없고, 가격은 미용실마다 다르다", async ({ page }) => {
    await openBookingAt(page, 2, { petId: "pet-1", serviceId: "svc-1" });
    await expect(page.getByRole("button", { name: /캣살롱 모모/ })).toBeDisabled();

    // 해피테일 기본 미용 35,000원 → 10% 쿠폰 적용 31,500원
    await page.getByRole("button", { name: /해피테일/ }).click();
    await expect(heading(page)).toHaveText("누구에게 맡길까요?");
    await expect(page.getByText("₩ 31,500").locator("visible=true").first()).toBeVisible();
  });

  test("고양이 전문 미용실을 고른 채 강아지를 선택하면 미용실 선택이 풀린다", async ({ page }) => {
    await openBookingAt(page, 0, { salonId: "salon-6" });
    await page.getByRole("button", { name: /콩이/ }).click();
    await expect(page.getByRole("status")).toContainText("고양이 전용");
    expect((await readDraft(page)).salonId).toBeNull();
  });

  test("같은 아이의 다른 예약과 겹치는 시간은 고를 수 없다", async ({ page }) => {
    await page.goto("/");
    const seed = (await readDb(page)).bookings.find(
      (b) => b.petId === "pet-1" && b.status === "confirmed"
    )!;
    await openBookingAt(page, 4, {
      petId: "pet-1",
      serviceId: "svc-4",
      salonId: "salon-5",
      groomerId: "grm-10",
      date: seed.date,
    });
    await expect(
      page.getByRole("button", { name: `${seed.time}, 다른 예약과 겹침` })
    ).toBeDisabled();
    await expect(page.getByText(/다른 예약과 겹치는 시간은 고를 수 없어요/)).toBeVisible();
  });

  test("주소의 단계를 건너뛰어도 선택값이 맞지 않으면 앞 단계로 돌아간다", async ({ page }) => {
    await openBookingAt(page, 5, { petId: "pet-1" });
    await expect(heading(page)).toHaveText("콩이에게 어떤 관리가 필요할까요?");
  });

  test("지난 날짜가 저장돼 있으면 비우고 다시 고르게 한다", async ({ page }) => {
    await openBookingAt(page, 4, {
      petId: "pet-1",
      serviceId: "svc-1",
      salonId: "salon-1",
      groomerId: "grm-1",
      date: dateKeyFromToday(-3),
      time: "10:00",
    });
    await expect.poll(async () => (await readDraft(page)).date).toBeNull();
    await expect(page.getByRole("button", { name: "다음" }).last()).toBeDisabled();
  });

  test("예약 중 새로고침해도 단계와 선택값이 유지된다", async ({ page }) => {
    await openBookingAt(page, 3, { petId: "pet-2", serviceId: "svc-1", salonId: "salon-2" });
    await page.reload();
    await expect(heading(page)).toHaveText("누구에게 맡길까요?");
  });

  test("예약 중 새 반려동물을 등록하면 그 아이를 선택한 채 돌아온다", async ({ page }) => {
    await openBookingAt(page, 0, {});
    await page.getByRole("link", { name: /새 반려동물 등록하기/ }).click();
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });
    await dialog.locator("#pet-name").fill("두부");
    await dialog.locator("#pet-breed").fill("비숑");
    await dialog.locator("#pet-age").fill("1");
    await dialog.locator("#pet-weight").fill("5");
    await dialog.getByRole("button", { name: "등록하기" }).click();
    await expect(heading(page)).toHaveText("두부에게 어떤 관리가 필요할까요?");
  });

  test("첫 단계의 뒤로 버튼은 홈으로 간다", async ({ page }) => {
    await openBookingAt(page, 0, {});
    await page.getByRole("button", { name: "홈으로" }).last().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
