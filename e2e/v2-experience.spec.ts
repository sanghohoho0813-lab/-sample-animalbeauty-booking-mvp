import { expect, test } from "@playwright/test";
import {
  DB_KEY,
  heading,
  offsetOf,
  openBookingAt,
  pickDate,
  pickFirstOpenTime,
  readDb,
  readDraft,
} from "./helpers";

test.describe("미용실 상세 → 예약", () => {
  test("결정 정보(가장 빠른 시간·가격·후기 요약)를 보고, 미용사를 골라 바로 예약한다", async ({
    page,
  }) => {
    await page.goto("/salons/salon-1");
    await expect(heading(page)).toHaveText("살롱 드 포우");
    await expect(page.getByText("가장 빠른 예약").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "가격" })).toBeVisible();
    await expect(page.getByRole("list", { name: "후기에서 많이 고른 키워드" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "이용 전 알아둘 점" })).toBeVisible();

    // 미용사를 골라 들어가면 아이·서비스만 고르고 바로 날짜로 (미용실·미용사 단계는 건너뛴다)
    await page.getByRole("button", { name: "김나연 미용사로 예약하기" }).click();
    await expect(heading(page)).toHaveText("어떤 아이가 미용을 받나요?");
    await page.getByRole("button", { name: /몽이/ }).click();
    await page.getByRole("button", { name: /부분 관리/ }).click();
    await expect(heading(page)).toHaveText("언제 방문할까요?");
    const draft = await readDraft(page);
    expect(draft).toMatchObject({ salonId: "salon-1", groomerId: "grm-2", petId: "pet-2" });
  });

  test("정기 휴무일은 달력에서 고를 수 없다", async ({ page }) => {
    await openBookingAt(page, 4, {
      petId: "pet-1",
      serviceId: "svc-1",
      salonId: "salon-1",
      groomerId: "grm-1",
    });
    // 살롱 드 포우는 매주 월요일 휴무 — 이번 달에 남은 월요일이 없으면 다음 달에서 확인
    const closedMonday = page.locator('button[data-date][aria-label$="월요일, 정기 휴무"]');
    if (!(await closedMonday.count())) await page.getByRole("button", { name: "다음 달" }).click();
    await expect(closedMonday.first()).toBeDisabled();
    await expect(page.getByText(/매주 월요일 휴무/)).toBeVisible();
  });
});

test.describe("지난 이용 정보 활용", () => {
  test("지난번과 같은 조건으로 예약 — 요청사항까지 불러온다", async ({ page }) => {
    await openBookingAt(page, 1, { petId: "pet-1" });
    await expect(page.getByText(/지난번 콩이/)).toBeVisible();
    await page.getByRole("button", { name: "같은 조건으로 예약" }).click();
    await expect(heading(page)).toHaveText("언제 방문할까요?");
    expect(await readDraft(page)).toMatchObject({
      serviceId: "svc-2",
      salonId: "salon-1",
      groomerId: "grm-2",
    });

    await pickDate(page, 4);
    await pickFirstOpenTime(page);
    await page.getByRole("button", { name: "다음" }).last().click();
    await expect(page.getByText("지난번 요청사항을 불러왔어요")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "얼굴은 동그랗게", pressed: true })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/미용사에게 전할 말/)).toHaveValue("곰돌이컷으로 해주세요");

    // 하나 더 고르고 확정 → 예약 상세에 그대로 남는다
    await page.getByRole("button", { name: "발톱은 짧게" }).click();
    await page.getByRole("button", { name: "예약 확정하기" }).last().click();
    await page.waitForURL(/\/booking\/complete\//);
    await expect(page.getByRole("heading", { name: "미용사에게 전달한 내용" })).toBeVisible();
    await expect(page.getByText("발톱은 짧게")).toBeVisible();
  });

  test("미용사 단계에서 지난번 담당 미용사가 맨 위에 표시된다", async ({ page }) => {
    await openBookingAt(page, 3, { petId: "pet-1", serviceId: "svc-1", salonId: "salon-1" });
    await expect(page.locator("main button[aria-pressed]").first()).toContainText("지난번 담당");
  });
});

test.describe("쿠폰", () => {
  test("처음 가는 미용실은 첫 방문 쿠폰이 자동 적용되고, '사용 안 함'으로 바꿀 수 있다", async ({
    page,
  }) => {
    // 멍뭉살롱(기본 미용 40,000원): 멤버 10% 4,000원 < 첫 방문 5,000원
    await openBookingAt(page, 4, {
      petId: "pet-2",
      serviceId: "svc-1",
      salonId: "salon-2",
      groomerId: "grm-5",
    });
    await pickDate(page, 3);
    await pickFirstOpenTime(page);
    await page.getByRole("button", { name: "다음" }).last().click();
    await expect(page.getByRole("radio", { name: /첫 방문 5,000원 할인/ })).toBeChecked();
    await expect(page.getByText("₩ 35,000").locator("visible=true").first()).toBeVisible();
    // 이미 쓴 1회용 쿠폰(스파 15%)은 고를 수 없다
    await expect(page.getByRole("radio", { name: /스파 15% 할인/ })).toBeDisabled();
    await page.getByRole("radio", { name: "사용 안 함" }).check();
    await expect(page.getByText("₩ 40,000").locator("visible=true").first()).toBeVisible();
  });
});

test.describe("예약 이후", () => {
  test("일정 변경 — 같은 미용사의 빈 시간으로 옮기고 변경 이력을 남긴다", async ({ page }) => {
    await page.goto("/bookings/bk-seed-1");
    const original = await heading(page).textContent();
    await page.getByRole("button", { name: "일정 변경" }).click();
    const sheet = page.getByRole("dialog", { name: "예약 일정 변경" });
    await expect(sheet.getByRole("button", { name: "날짜와 시간을 골라주세요" })).toBeDisabled();
    const key = await pickDate(page, 5);
    const time = await pickFirstOpenTime(page);
    await sheet.getByRole("button", { name: /로 변경$/ }).click();
    await expect(sheet).toBeHidden();
    await expect(heading(page)).toContainText(time);
    await expect(heading(page)).not.toHaveText(original!);
    await expect(page.getByText(/에서 변경된 예약이에요/)).toBeVisible();
    const saved = (await readDb(page)).bookings.find((b) => b.id === "bk-seed-1")!;
    expect(saved).toMatchObject({ date: key, time });
    expect(offsetOf(key)).toBeGreaterThanOrEqual(5);
  });

  test("캘린더에 추가 — .ics 파일을 내려받는다", async ({ page }) => {
    await page.goto("/bookings/bk-seed-2");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "캘린더에 추가" }).click();
    expect((await download).suggestedFilename()).toMatch(/^pawbeauty-PB\d{8}-\d{4}\.ics$/);
  });

  test("이용 완료된 예약은 후기 → 다음 미용 추천일과 재예약으로 이어진다", async ({ page }) => {
    await page.goto("/bookings/bk-seed-4");
    await expect(page.getByRole("heading", { name: "콩이의 미용은 어땠나요?" })).toBeVisible();
    await page.getByRole("button", { name: "후기 작성" }).click();
    const dialog = page.getByRole("dialog", { name: "후기 작성" });
    await dialog.getByRole("button", { name: "스타일이 마음에 들어요" }).click();
    await dialog.getByRole("button", { name: "후기 등록하기" }).click();
    await expect(page.getByRole("heading", { name: /다음 미용은 .*쯤이 좋아요/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "내가 남긴 후기" })).toBeVisible();
    await page.getByRole("button", { name: "같은 조건으로 다시 예약" }).click();
    await expect(heading(page)).toHaveText("언제 방문할까요?");
  });

  test("방문 당일 예약은 앱에서 바꿀 수 없다고 안내한다", async ({ page }) => {
    await page.goto("/");
    const today = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
    });
    await page.evaluate(
      ([key, date]) => {
        const db = JSON.parse(localStorage.getItem(key)!);
        db.bookings = db.bookings.map((b: { id: string }) =>
          b.id === "bk-seed-1" ? { ...b, date, time: "23:00" } : b
        );
        localStorage.setItem(key, JSON.stringify(db));
      },
      [DB_KEY, today] as const
    );
    await page.goto("/bookings/bk-seed-1");
    await expect(page.getByText("오늘 방문").first()).toBeVisible();
    await expect(page.getByText(/방문 당일에는 앱에서 변경·취소할 수 없어요/)).toBeVisible();
    await expect(page.getByRole("button", { name: "예약 취소" })).toHaveCount(0);
  });
});

test.describe("예외 상황", () => {
  test("그새 삭제된 아이로 고르던 예약은 처음부터 다시 고르게 한다", async ({ page }) => {
    await openBookingAt(page, 4, {
      petId: "pet-deleted",
      serviceId: "svc-1",
      salonId: "salon-1",
      groomerId: "grm-1",
    });
    await expect(heading(page)).toHaveText("어떤 아이가 미용을 받나요?");
    await expect
      .poll(() => readDraft(page))
      .toMatchObject({ petId: null, serviceId: null, salonId: null });
  });

  test("확정 직전에 시간이 막히면 가까운 대안 시간으로 바로 바꿔 예약한다", async ({ page }) => {
    await openBookingAt(page, 4, {
      petId: "pet-3",
      serviceId: "svc-5",
      salonId: "salon-6",
      groomerId: "grm-12",
    });
    const date = await pickDate(page, 3);
    const time = await pickFirstOpenTime(page);
    await page.getByRole("button", { name: "다음" }).last().click();
    await expect(heading(page)).toHaveText("예약 내용을 확인해주세요");

    // 확인 화면을 보는 사이 다른 탭에서 같은 미용사·시간이 먼저 예약됨
    await page.evaluate(
      ([key, d, t]) => {
        const db = JSON.parse(localStorage.getItem(key)!);
        db.bookings.push({
          ...db.bookings[0],
          id: "bk-other",
          petId: "pet-x",
          groomerId: "grm-12",
          salonId: "salon-6",
          date: d,
          time: t,
          status: "confirmed",
        });
        localStorage.setItem(key, JSON.stringify(db));
        window.dispatchEvent(new StorageEvent("storage", { key, newValue: JSON.stringify(db) }));
      },
      [DB_KEY, date, time] as const
    );
    await page.getByRole("button", { name: "예약 확정하기" }).last().click();
    const dialog = page.getByRole("dialog", { name: "예약 시간 다시 고르기" });
    await expect(dialog.getByRole("heading", { name: "방금 그 시간이 마감됐어요" })).toBeVisible();
    await dialog
      .getByRole("button", { name: /이 시간으로/ })
      .first()
      .click();
    await page.getByRole("button", { name: "예약 확정하기" }).last().click();
    await page.waitForURL(/\/booking\/complete\//);
  });

  test("예정된 예약이 있는 아이는 삭제할 수 없고, 새로 등록한 아이는 삭제된다", async ({
    page,
  }) => {
    await page.goto("/pets");
    await page.getByRole("button", { name: "콩이 정보 수정" }).click();
    await page.getByRole("button", { name: "이 반려동물 삭제" }).click();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect(page.getByText(/예약을 먼저 취소해주세요/)).toBeVisible();

    await page.goto("/pets?add=1");
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });
    await dialog.locator("#pet-name").fill("가나다라마바사아자차");
    await dialog.locator("#pet-breed").fill("아주아주긴이름의믹스견종");
    await dialog.locator("#pet-age").fill("1");
    await dialog.locator("#pet-weight").fill("3");
    await dialog.getByRole("button", { name: "등록하기" }).click();
    await expect(dialog).toBeHidden();
    const count = (await readDb(page)).pets.length;

    // 긴 이름이 어디서도 화면을 넘치지 않는다
    for (const path of ["/pets", "/", "/booking", "/my"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }

    await page.goto("/pets");
    await page.getByRole("button", { name: "가나다라마바사아자차 정보 수정" }).click();
    await page.getByRole("button", { name: "이 반려동물 삭제" }).click();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await expect.poll(async () => (await readDb(page)).pets.length).toBe(count - 1);
  });
});
