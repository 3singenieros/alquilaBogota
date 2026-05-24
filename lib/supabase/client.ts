import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isMockMode } from "@/config/app-mode";
import type { Database } from "@/lib/supabase/types";

let browserClient: SupabaseClient<Database> | null = null;

/** Cliente Supabase singleton (browser / entorno compartido). */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (isMockMode()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) {
    browserClient = createClient<Database>(url, key);
  }
  return browserClient;
}

export function createSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (isMockMode()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}
