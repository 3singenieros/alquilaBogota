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
      `Supabase no configurado (APP_MODE=${getAppMode()}). Revise NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.`
    );
  }
  return client;
}

export function extractEntityCodes(rows: unknown): string[] {
  return ((rows as { code: string }[] | null) ?? []).map((r) => r.code);
}
