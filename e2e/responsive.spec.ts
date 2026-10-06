import { expect, test } from "@playwright/test";

const PAGES = ["/", "/salons", "/booking", "/bookings", "/favorites", "/pets", "/my"];
const WIDTHS = [360, 390, 430, 768, 1024, 1280];

test.describe("반응형 — 가로 넘침·콘솔 오류 없음", () => {
  test.skip(({ isMobile }) => isMobile, "폭을 직접 바꿔가며 한 번만 검사");

  for (const width of WIDTHS) {
    test(`${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `${path} @${width}px`).toBeLessThanOrEqual(0);
      }
      expect(errors).toEqual([]);
    });
  }
});
