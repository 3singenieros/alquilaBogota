/**
 * Cliente Supabase para scripts Node (check:supabase, check:storage).
 * Node < 22 no incluye WebSocket nativo; el SDK Realtime requiere `ws`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

export function createSupabaseCliClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as unknown as typeof WebSocket,
    },
  });
}
