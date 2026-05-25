import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";
import { loginE2eSession } from "./helpers/auth";

const authFile = path.join("playwright", ".auth", "admin.json");

setup("sesión admin demo para E2E", async ({ page, baseURL }) => {
  if (!baseURL) {
    throw new Error("baseURL no definida en playwright.config.ts");
  }

  setup.setTimeout(60_000);

  await loginE2eSession(page, baseURL, "ADMIN");

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
