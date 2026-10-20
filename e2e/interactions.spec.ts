import { deflateSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { heading, openBookingAt, readDb, readDraft } from "./helpers";

/** 테스트용 PNG (가로로 긴 그라데이션) — 업로드하면 가운데가 정사각형으로 잘려야 한다 */
function makePng(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8); // 8bit RGB
  const rows = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const o = y * (width * 3 + 1);
    for (let x = 0; x < width; x += 1) rows.set([(x * 4) & 255, 150, (y * 6) & 255], o + 1 + x * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

test.describe("반려동물 사진", () => {
  test("사진을 올리면 정사각형으로 줄여 저장하고, 수정에서 지울 수 있다", async ({ page }) => {
    await page.goto("/pets?add=1");
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "dog.png",
      mimeType: "image/png",
      buffer: makePng(64, 40),
    });
    const preview = dialog.locator("img").first();
    await expect(preview).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
    // 원본 64×40 → 가운데 40×40
    expect(
      await preview.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])
    ).toEqual([40, 40]);

    await dialog.locator("#pet-name").fill("사진이");
    await dialog.locator("#pet-breed").fill("믹스");
    await dialog.locator("#pet-age").fill("2");
    await dialog.locator("#pet-weight").fill("5");
    await dialog.getByRole("button", { name: "등록하기" }).click();
    await expect(dialog).toBeHidden();

    const saved = (await readDb(page)).pets.find((p) => p.name === "사진이") as { image?: string };
    expect(saved.image).toMatch(/^data:image\/jpeg;base64,/);
    await expect(page.getByRole("button", { name: "사진이 사진 원본 보기" })).toBeVisible();

    // 새로고침해도 사진이 남는다
    await page.reload();
    await expect(page.getByRole("button", { name: "사진이 사진 원본 보기" })).toBeVisible();

    await page.getByRole("button", { name: "사진이 정보 수정" }).click();
    const edit = page.getByRole("dialog", { name: "사진이 정보 수정" });
    await edit.getByRole("button", { name: "사진 지우기" }).click();
    await edit.getByRole("button", { name: "저장하기" }).click();
    await expect(edit).toBeHidden();
    const after = (await readDb(page)).pets.find((p) => p.name === "사진이") as { image?: string };
    expect(after.image).toBeUndefined();
  });

  test("이미지가 아닌 파일은 받지 않고 알려준다", async ({ page }) => {
    await page.goto("/pets?add=1");
    const dialog = page.getByRole("dialog", { name: "새 가족 등록하기" });
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "memo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByText("사진을 불러오지 못했어요")).toBeVisible();
    await expect(dialog.getByText("사진 올리기")).toBeVisible();
  });
});

test.describe("예약 지름길", () => {
  test("'가장 빠른 예약'을 누르면 날짜와 시간이 한 번에 정해진다", async ({ page }) => {
    await openBookingAt(page, 4, {
      petId: "pet-1",
      serviceId: "svc-1",
      salonId: "salon-1",
      groomerId: "grm-1",
    });
    await page.getByRole("button", { name: "이 시간으로" }).click();
    await expect(page.getByRole("button", { name: "선택됨" })).toBeDisabled();
    const draft = await readDraft(page);
    expect(draft.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(draft.time).toMatch(/^\d{2}:\d{2}$/);
    await expect(
      page.getByRole("group", { name: /시간$/ }).getByRole("button", { pressed: true })
    ).toHaveText(draft.time!);
    await page.getByRole("button", { name: "다음" }).last().click();
    await expect(heading(page)).toHaveText("예약 내용을 확인해주세요");
  });
});

test.describe("앱처럼 다루기", () => {
  test("시트는 손잡이를 아래로 끌면 닫힌다", async ({ page, isMobile }) => {
    test.skip(!isMobile, "손잡이는 모바일 시트에만 있다");
    await page.goto("/bookings/bk-seed-1");
    await page.getByRole("button", { name: "일정 변경" }).click();
    const sheet = page.getByRole("dialog", { name: "예약 일정 변경" });
    await expect(sheet).toBeVisible();
    const box = (await sheet.locator("[data-sheet-handle]").boundingBox())!;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, box.y + 8);
    await page.mouse.down();
    for (let i = 1; i <= 8; i += 1) await page.mouse.move(x, box.y + 8 + i * 24);
    await page.mouse.up();
    await expect(sheet).toBeHidden();
  });

  test("조금만 끌었다 놓으면 시트가 제자리로 돌아온다", async ({ page, isMobile }) => {
    test.skip(!isMobile, "손잡이는 모바일 시트에만 있다");
    await page.goto("/bookings/bk-seed-4");
    await page.getByRole("button", { name: "후기 작성" }).first().click();
    const sheet = page.getByRole("dialog", { name: "후기 작성" });
    const box = (await sheet.locator("[data-sheet-handle]").boundingBox())!;
    const x = box.x + box.width / 2;
    await page.mouse.move(x, box.y + 8);
    await page.mouse.down();
    await page.mouse.move(x, box.y + 40, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    await expect(sheet.getByRole("button", { name: "후기 등록하기" })).toBeVisible();
  });

  test("자주 찾는 검색어로 바로 찾고, 지우기 버튼으로 되돌린다", async ({ page }) => {
    await page.goto("/salons");
    const count = page.locator("p[aria-live]");
    await expect(count).toContainText("6곳");
    await page.getByRole("button", { name: "#대형견" }).click();
    await expect(page.getByLabel("미용실 검색")).toHaveValue("대형견");
    await expect(count).not.toContainText("6곳");
    await expect(
      page.locator("main").getByText("멍뭉살롱").locator("visible=true").first()
    ).toBeVisible();
    await page.getByRole("button", { name: "검색어 지우기" }).click();
    await expect(page.getByLabel("미용실 검색")).toHaveValue("");
    await expect(count).toContainText("6곳");
  });

  test("매장 공유 — 공유 창이 없는 브라우저는 링크를 복사한다", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            (window as unknown as { __copied: string }).__copied = text;
          },
        },
        configurable: true,
      });
    });
    await page.goto("/salons/salon-2");
    await page.getByRole("button", { name: "멍뭉살롱 공유하기" }).click();
    await expect(page.getByText("매장 링크를 복사했어요")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __copied: string }).__copied)).toMatch(
      /\/salons\/salon-2$/
    );
  });
});
