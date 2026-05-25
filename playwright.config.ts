import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL,
    screenshot: "on",
    video: "retain-on-failure",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "login",
      testMatch: /login\.spec\.ts/,
      use: { storageState: { cookies: [], origins: [] } },
    },
    {
      name: "evidencias",
      testMatch: /mvp-evidencias-tesis\.spec\.ts/,
      dependencies: ["setup"],
      timeout: 20_000,
      use: {
        storageState: "playwright/.auth/admin.json",
      },
    },
    {
      name: "e2e",
      testMatch: /flows\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: "playwright/.auth/admin.json",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_MODE: "true",
      NEXT_PUBLIC_E2E_MODE: "true",
      E2E_AUTH_ENABLED: "true",
      NEXT_PUBLIC_E2E_AUTH: "true",
      NEXT_PUBLIC_APP_MODE: "MOCK",
      NEXT_PUBLIC_USE_MOCK_DATA: "true",
    },
  },
});
