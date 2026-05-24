import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isMockMode } from "@/config/app-mode";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente Supabase para Server Components, Server Actions y servicios.
 * Usa la anon key; las reglas RLS aplicarán cuando estén activas.
 */
export function createSupabaseServerClient(): SupabaseClient<Database> | null {
  if (isMockMode()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let serverClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  if (serverClient === undefined) {
    serverClient = createSupabaseServerClient();
  }
  return serverClient;
}
