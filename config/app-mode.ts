/**
 * Modo de persistencia de la aplicación.
 * MOCK: datos en memoria (desarrollo / demo académico).
 * SUPABASE: PostgreSQL + Storage vía Supabase.
 */
import {
  getSupabaseAnonKey,
  getNormalizedSupabaseUrl,
  validateSupabaseUrl,
} from "@/lib/supabase/env";

export type AppMode = "MOCK" | "SUPABASE";

export function getAppMode(): AppMode {
  const explicit = process.env.NEXT_PUBLIC_APP_MODE?.trim().toUpperCase();
  if (explicit === "MOCK" || explicit === "SUPABASE") {
    return explicit;
  }

  const legacy = process.env.NEXT_PUBLIC_USE_MOCK_DATA?.trim().toLowerCase();
  if (legacy === "false") return "SUPABASE";
  if (legacy === "true") return "MOCK";

  return "MOCK";
}

export function isMockMode(): boolean {
  return getAppMode() === "MOCK";
}

export function isSupabaseMode(): boolean {
  return getAppMode() === "SUPABASE";
}

export function hasSupabaseEnv(): boolean {
  return Boolean(getNormalizedSupabaseUrl() && getSupabaseAnonKey());
}

const SUPABASE_ENV_ERROR =
  "Supabase está activo pero faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.";

function supabaseEnvErrorMessage(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (rawUrl) {
    const check = validateSupabaseUrl(rawUrl);
    if (!check.ok) return check.error;
  }
  return SUPABASE_ENV_ERROR;
}

export function assertSupabaseEnvConfigured(): void {
  if (isSupabaseMode() && !hasSupabaseEnv()) {
    console.error(`[APP MODE] SUPABASE — ${supabaseEnvErrorMessage()}`);
  }
}

function logAppModeInDevelopment(): void {
  if (process.env.NODE_ENV !== "development") return;
  const scope = globalThis as typeof globalThis & { __appModeLogged?: boolean };
  if (scope.__appModeLogged) return;
  scope.__appModeLogged = true;
  const mode = getAppMode();
  console.log(`[APP MODE] ${mode}`);
  if (mode === "SUPABASE") {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
    if (rawUrl) {
      const check = validateSupabaseUrl(rawUrl);
      if (check.ok && check.normalizedFromRestV1) {
        console.warn(
          "[APP MODE] NEXT_PUBLIC_SUPABASE_URL contenía /rest/v1; use solo https://xxxx.supabase.co"
        );
      } else if (!check.ok) {
        console.error(`[APP MODE] SUPABASE — ${check.error}`);
      }
    } else if (!hasSupabaseEnv()) {
      console.error(`[APP MODE] SUPABASE — ${SUPABASE_ENV_ERROR}`);
    }
  }
}

logAppModeInDevelopment();
