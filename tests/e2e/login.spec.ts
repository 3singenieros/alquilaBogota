import { test, expect } from "@playwright/test";
import { capturarEvidencia } from "./helpers/evidencias";
import { loginE2eUi, waitForDashboard } from "./helpers/auth";

test.describe("Login", () => {
  test("muestra formulario y panel E2E demo", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("page-login")).toBeVisible();
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("e2e-demo-login")).toBeVisible();
    await expect(page.getByTestId("e2e-login-admin")).toBeVisible();
    await expect(page.getByTestId("e2e-login-arrendador")).toBeVisible();
    await expect(page.getByTestId("e2e-login-arrendatario")).toBeVisible();
  });

  test("botón e2e-login-admin llega al dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("e2e-demo-login").waitFor({ state: "visible" });
    await page.getByTestId("e2e-login-admin").click();
    await waitForDashboard(page);
    await expect(page.getByTestId("page-dashboard")).toBeVisible();
    await capturarEvidencia(page, "01-login-dashboard.png");
  });
});
