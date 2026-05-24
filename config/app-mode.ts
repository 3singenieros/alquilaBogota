/**
 * Modo de persistencia de la aplicación.
 * MOCK: datos en memoria (desarrollo / demo académico).
 * SUPABASE: PostgreSQL + Storage vía Supabase.
 *
 * Prioridad:
 * 1. NEXT_PUBLIC_APP_MODE (MOCK | SUPABASE)
 * 2. NEXT_PUBLIC_USE_MOCK_DATA (legacy: true → MOCK, false → SUPABASE)
 * 3. Default: MOCK
 */
export type AppMode = "MOCK" | "SUPABASE";

export function getAppMode(): AppMode {
  const explicit = process.env.NEXT_PUBLIC_APP_MODE?.trim().toUpperCase();
  if (explicit === "MOCK" || explicit === "SUPABASE") {
    return explicit;
  }

  // Compatibilidad legacy
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return "SUPABASE";
  }
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return "MOCK";
  }

  return "MOCK";
}

export function isMockMode(): boolean {
  return getAppMode() === "MOCK";
}

export function isSupabaseMode(): boolean {
  return getAppMode() === "SUPABASE";
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

function logAppModeInDevelopment(): void {
  if (process.env.NODE_ENV !== "development") return;
  const scope = globalThis as typeof globalThis & { __appModeLogged?: boolean };
  if (scope.__appModeLogged) return;
  scope.__appModeLogged = true;
  console.log(`[APP MODE] ${getAppMode()}`);
}

logAppModeInDevelopment();
