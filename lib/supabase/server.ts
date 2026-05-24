import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, isMockMode } from "@/config/app-mode";
import { getNormalizedSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente Supabase para Server Components, Server Actions y servicios.
 * Usa la anon key; las reglas RLS aplicarán cuando estén activas.
 */
export function createSupabaseServerClient(): SupabaseClient<Database> | null {
  if (isMockMode() || !hasSupabaseEnv()) return null;
  const url = getNormalizedSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let serverClient: SupabaseClient<Database> | null | undefined;
let serverClientUrl: string | null | undefined;

export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  const url = getNormalizedSupabaseUrl();
  if (serverClient !== undefined && serverClientUrl === url) {
    return serverClient;
  }
  serverClient = createSupabaseServerClient();
  serverClientUrl = url;
  return serverClient;
}
