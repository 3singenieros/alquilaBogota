import { test, expect } from "@playwright/test";

test.describe("Flujos MVP — ADMIN", () => {
  test("dashboard carga resumen", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("page-dashboard")).toBeVisible();
  });

  test("inmuebles — listado", async ({ page }) => {
    await page.goto("/inmuebles");
    await expect(page.getByTestId("page-inmuebles")).toBeVisible();
  });

  test("contratos — listado", async ({ page }) => {
    await page.goto("/contratos");
    await expect(page.getByTestId("page-contratos")).toBeVisible();
  });

  test("solicitudes de contrato", async ({ page }) => {
    await page.goto("/solicitudes-contrato");
    const pageEl = page.getByTestId("page-solicitudes-contrato");
    const sinAcceso = page.getByText(/sin acceso|no autorizado/i);
    await expect(pageEl.or(sinAcceso)).toBeVisible({ timeout: 15_000 });
  });

  test("pagos reportados", async ({ page }) => {
    await page.goto("/pagos");
    await expect(page.getByTestId("page-pagos")).toBeVisible();
  });

  test("servicios públicos", async ({ page }) => {
    await page.goto("/servicios");
    await expect(page.getByTestId("page-servicios")).toBeVisible();
  });

  test("mantenimiento", async ({ page }) => {
    await page.goto("/mantenimiento");
    await expect(page.getByTestId("page-mantenimiento")).toBeVisible();
  });

  test("no renovación", async ({ page }) => {
    await page.goto("/no-renovacion");
    await expect(page.getByTestId("page-no-renovacion")).toBeVisible();
  });

  test("trazabilidad", async ({ page }) => {
    await page.goto("/trazabilidad");
    await expect(page.getByTestId("page-trazabilidad")).toBeVisible();
  });

  test("reportes", async ({ page }) => {
    await page.goto("/reportes");
    await expect(page.getByTestId("page-reportes")).toBeVisible();
  });

  test("visor de documentos en pagos", async ({ page }) => {
    await page.goto("/pagos");
    await expect(page.getByTestId("page-pagos")).toBeVisible();
    const btn = page.getByTestId("ver-adjuntos-button").first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await expect(page.getByTestId("document-viewer-close")).toBeVisible();
    }
  });
});
