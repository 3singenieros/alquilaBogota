import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type E2eRole = "ADMIN" | "ARRENDADOR" | "ARRENDATARIO";

const EVIDENCIAS_DIR = path.join("test-results", "evidencias");

async function screenshotOnFailure(page: Page, name: string) {
  fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  const file = path.join(EVIDENCIAS_DIR, name);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

/**
 * Espera dashboard autenticado. Si falla, guarda captura y reporta la URL actual.
 */
export async function waitForDashboard(page: Page, timeoutMs = 45_000) {
  const dashboard = page.getByTestId("page-dashboard");
  try {
    await page.waitForURL(
      (url) => {
        const p = url.pathname;
        return p === "/" || p === "";
      },
      { timeout: timeoutMs }
    );
    await dashboard.waitFor({ state: "visible", timeout: timeoutMs });
  } catch {
    const shot = await screenshotOnFailure(page, "setup-dashboard-timeout.png");
    throw new Error(
      `No se alcanzó el dashboard (data-testid="page-dashboard"). ` +
        `URL actual: ${page.url()}. Captura: ${shot}`
    );
  }
}

/**
 * Login E2E vía API en el mismo contexto del navegador (cookies compartidas con page).
 * No usar el fixture `request` aislado de Playwright.
 */
export async function loginE2eSession(
  page: Page,
  baseURL: string,
  role: E2eRole = "ADMIN"
) {
  await page.goto(`${baseURL}/login`);

  const res = await page.request.post(`${baseURL}/api/e2e/login`, {
    data: { role },
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok()) {
    const body = await res.text();
    const shot = await screenshotOnFailure(page, "setup-login-api-failure.png");
    throw new Error(
      `POST /api/e2e/login falló (${res.status()}): ${body}. ` +
        `¿Servidor con E2E_MODE/E2E_AUTH activo? Captura: ${shot}`
    );
  }

  await page.goto(`${baseURL}/`);
  await waitForDashboard(page);
}

/** Login por UI (botones demo en /login). */
export async function loginE2eUi(page: Page, role: E2eRole = "ADMIN") {
  await page.goto("/login");
  await expect(page.getByTestId("page-login")).toBeVisible({ timeout: 20_000 });

  const panel = page.getByTestId("e2e-demo-login");
  try {
    await panel.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    const shot = await screenshotOnFailure(page, "setup-e2e-panel-missing.png");
    throw new Error(
      `Panel E2E no visible en /login. Active NEXT_PUBLIC_E2E_MODE=true en el servidor dev. Captura: ${shot}`
    );
  }

  await page.getByTestId(`e2e-login-${role.toLowerCase()}`).click();
  await waitForDashboard(page);
}
