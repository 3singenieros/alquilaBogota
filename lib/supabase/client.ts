import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv, isMockMode } from "@/config/app-mode";
import { getNormalizedSupabaseUrl, getSupabaseAnonKey } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

let browserClient: SupabaseClient<Database> | null = null;
let browserClientUrl: string | null = null;

function createBrowserClient(): SupabaseClient<Database> | null {
  if (isMockMode() || !hasSupabaseEnv()) return null;
  const url = getNormalizedSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;

  if (browserClient && browserClientUrl === url) {
    return browserClient;
  }

  browserClient = createClient<Database>(url, key);
  browserClientUrl = url;
  return browserClient;
}

/** Cliente Supabase singleton (browser / entorno compartido). */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  return createBrowserClient();
}

export function createSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (isMockMode() || !hasSupabaseEnv()) return null;
  const url = getNormalizedSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}
