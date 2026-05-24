/**
 * Normaliza Project URL de Supabase.
 * Debe ser: https://xxxx.supabase.co (sin /rest/v1 — el SDK lo agrega).
 */
export function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim();
  url = url.replace(/\/rest\/v1\/?$/i, "");
  return url.replace(/\/+$/, "");
}

export function hasRestV1InSupabaseUrl(raw: string): boolean {
  return /\/rest\/v1/i.test(raw.trim());
}

export type SupabaseUrlValidation =
  | { ok: true; url: string; normalizedFromRestV1: boolean }
  | { ok: false; error: string };

export function validateSupabaseUrl(raw: string): SupabaseUrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL está vacía." };
  }
  if (trimmed.includes("REEMPLAZAR")) {
    return { ok: false, error: "Reemplace el placeholder de NEXT_PUBLIC_SUPABASE_URL." };
  }

  const normalizedFromRestV1 = hasRestV1InSupabaseUrl(trimmed);
  const url = normalizeSupabaseUrl(trimmed);

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL debe usar https://." };
    }
    if (!parsed.hostname.endsWith(".supabase.co")) {
      return {
        ok: false,
        error: "NEXT_PUBLIC_SUPABASE_URL debe ser del formato https://xxxx.supabase.co",
      };
    }
    if (parsed.pathname && parsed.pathname !== "/") {
      return {
        ok: false,
        error: `NEXT_PUBLIC_SUPABASE_URL no debe tener path (${parsed.pathname}). Use solo https://xxxx.supabase.co`,
      };
    }
    return { ok: true, url, normalizedFromRestV1 };
  } catch {
    return { ok: false, error: "NEXT_PUBLIC_SUPABASE_URL no es una URL válida." };
  }
}

export function getNormalizedSupabaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  const validation = validateSupabaseUrl(raw);
  return validation.ok ? validation.url : null;
}

export function getSupabaseAnonKey(): string | null {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key || key.includes("REEMPLAZAR")) return null;
  return key;
}
