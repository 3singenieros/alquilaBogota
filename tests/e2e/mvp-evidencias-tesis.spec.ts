import { test } from "@playwright/test";
import { esperarPantalla, safeScreenshot } from "./helpers/evidencias";

test.describe.configure({ timeout: 15_000 });

test.describe("Evidencias tesis — login (sin sesión)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("01 login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 12_000 });
    await page
      .getByTestId("page-login")
      .waitFor({ state: "visible", timeout: 8_000 })
      .catch(() => undefined);
    await safeScreenshot(page, "01-login.png");
  });
});

test.describe("Evidencias tesis — módulos (sesión admin)", () => {
  test("02 dashboard", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/",
      testId: "page-dashboard",
      textoFallback: /Dashboard/i,
    });
    await safeScreenshot(page, "02-dashboard.png");
  });

  test("03 inmuebles", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/inmuebles",
      testId: "page-inmuebles",
      textoFallback: /Inmuebles/i,
    });
    await safeScreenshot(page, "03-inmuebles.png");
  });

  test("04 contratos", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/contratos",
      testId: "page-contratos",
      textoFallback: /Contratos/i,
    });
    await safeScreenshot(page, "04-contratos.png");
  });

  test("05 pagos", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/pagos",
      testId: "page-pagos",
      textoFallback: /Pagos reportados/i,
    });
    await safeScreenshot(page, "05-pagos.png");
  });

  test("06 servicios", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/servicios",
      testId: "page-servicios",
      textoFallback: /Servicios públicos/i,
    });
    await safeScreenshot(page, "06-servicios.png");
  });

  test("07 mantenimiento", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/mantenimiento",
      testId: "page-mantenimiento",
      textoFallback: /Mantenimiento/i,
    });
    await safeScreenshot(page, "07-mantenimiento.png");
  });

  test("08 no renovación", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/no-renovacion",
      testId: "page-no-renovacion",
      textoFallback: /No renovación/i,
    });
    await safeScreenshot(page, "08-no-renovacion.png");
  });

  test("09 trazabilidad", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/trazabilidad",
      testId: "page-trazabilidad",
      textoFallback: /Trazabilidad/i,
    });
    await safeScreenshot(page, "09-trazabilidad.png");
  });

  test("10 reportes", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/reportes",
      testId: "page-reportes",
      textoFallback: /Reportes/i,
    });
    await safeScreenshot(page, "10-reportes.png");
  });

  test("11 visor documentos", async ({ page }) => {
    await esperarPantalla(page, {
      path: "/pagos",
      testId: "page-pagos",
      textoFallback: /Pagos reportados/i,
    });

    const verAdjuntos = page.getByTestId("ver-adjuntos-button").first();
    try {
      await verAdjuntos.click({ timeout: 3_000 });
      await page
        .getByRole("button", { name: "Cerrar" })
        .waitFor({ state: "visible", timeout: 3_000 });
    } catch {
      // Siempre capturamos aunque no haya adjuntos o el modal no abra
    }

    await safeScreenshot(page, "11-visor-documentos.png");
  });
});
