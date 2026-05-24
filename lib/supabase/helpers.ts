import { getSupabaseClient } from "@/lib/supabase/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAppMode, isMockMode } from "@/config/app-mode";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getSupabase(): SupabaseClient | null {
  if (isMockMode()) return null;
  return getSupabaseServerClient() ?? getSupabaseClient();
}

export function requireSupabase(): SupabaseClient {
  if (isMockMode()) {
    throw new Error(
      "Supabase no disponible en APP_MODE=MOCK. Use repositorios mock o cambie NEXT_PUBLIC_APP_MODE=SUPABASE."
    );
  }
  const client = getSupabase();
  if (!client) {
    throw new Error(
      `Supabase está activo pero faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. (APP_MODE=${getAppMode()})`
    );
  }
  return client;
}

export function extractEntityCodes(rows: unknown): string[] {
  return ((rows as { code: string }[] | null) ?? []).map((r) => r.code);
}

/** Convierte IDs vacíos a null para FKs opcionales en PostgreSQL. */
export function nullableFkId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
