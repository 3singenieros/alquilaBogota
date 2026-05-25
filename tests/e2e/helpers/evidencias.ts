import fs from "fs";
import path from "path";
import type { Page } from "@playwright/test";

export const EVIDENCIAS_DIR = path.join("test-results", "evidencias");

/** Espera breve y guarda captura fullPage (no lanza si la página está incompleta). */
export async function safeScreenshot(page: Page, nombreArchivo: string) {
  await page.waitForTimeout(1000);
  fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  const destino = path.join(EVIDENCIAS_DIR, nombreArchivo);
  await page.screenshot({ path: destino, fullPage: true });
  return destino;
}

export type EsperarPantallaOpts = {
  path: string;
  testId?: string;
  textoFallback?: RegExp | string;
  timeoutMs?: number;
};

/**
 * Navega a la ruta y espera un indicador simple (testid, texto o URL).
 * No bloquea indefinidamente: timeouts cortos con fallbacks.
 */
export async function esperarPantalla(page: Page, opts: EsperarPantallaOpts) {
  const timeoutMs = opts.timeoutMs ?? 8_000;

  await page.goto(opts.path, {
    waitUntil: "domcontentloaded",
    timeout: 12_000,
  });

  if (opts.testId) {
    const ok = await page
      .getByTestId(opts.testId)
      .waitFor({ state: "visible", timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
    if (ok) return;
  }

  if (opts.textoFallback) {
    const ok = await page
      .getByText(opts.textoFallback)
      .first()
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return;
  }

  await page
    .waitForURL((url) => url.pathname === opts.path || url.pathname.startsWith(opts.path), {
      timeout: 3_000,
    })
    .catch(() => undefined);
}

/** @deprecated Usar safeScreenshot */
export async function capturarEvidencia(page: Page, nombreArchivo: string) {
  return safeScreenshot(page, nombreArchivo);
}
