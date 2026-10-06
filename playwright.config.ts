import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 테스트 — 프로덕션 빌드(`next start`)를 띄워 실제 사용자 흐름을 검사한다.
 * 먼저 `npm run build` 가 필요하다. (CI에서는 build 단계 뒤에 실행)
 *
 * 브라우저가 미리 설치된 환경이면 PW_CHROMIUM_PATH로 실행 파일을 지정할 수 있다.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    // 등장 애니메이션 도중의 반투명 상태를 측정하지 않도록 (앱은 이 설정에서 애니메이션을 끈다)
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
