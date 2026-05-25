/**
 * Verifica conexión a Supabase leyendo .env.local
 * Uso: npm run check:supabase
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createSupabaseCliClient } from "./supabase-cli-client";
import {
  getSupabaseAnonKey,
  hasRestV1InSupabaseUrl,
  normalizeSupabaseUrl,
  validateSupabaseUrl,
} from "../lib/supabase/env";

config({ path: resolve(process.cwd(), ".env.local") });

function getAppMode(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_MODE?.trim().toUpperCase();
  if (explicit === "MOCK" || explicit === "SUPABASE") return explicit;
  const legacy = process.env.NEXT_PUBLIC_USE_MOCK_DATA?.trim().toLowerCase();
  if (legacy === "false") return "SUPABASE";
  return "MOCK";
}

async function main() {
  const appMode = getAppMode();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = getSupabaseAnonKey() ?? "";

  console.log(`[check:supabase] APP_MODE=${appMode}`);

  if (!rawUrl || !key) {
    console.error(
      "❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
    process.exit(1);
  }

  if (hasRestV1InSupabaseUrl(rawUrl)) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL no debe incluir /rest/v1"
    );
    console.error(`   Valor actual: ${rawUrl}`);
    console.error("   Correcto:     https://xxxx.supabase.co");
    console.error("   (El SDK @supabase/supabase-js agrega /rest/v1 automáticamente)");
    process.exit(1);
  }

  const urlCheck = validateSupabaseUrl(rawUrl);
  if (!urlCheck.ok) {
    console.error(`❌ ${urlCheck.error}`);
    process.exit(1);
  }

  const url = urlCheck.url;
  console.log(`[check:supabase] URL base: ${url}`);

  if (appMode === "MOCK") {
    console.log(
      "ℹ️  APP_MODE=MOCK: la app usa mock; este script prueba solo la conexión."
    );
  }

  const supabase = createSupabaseCliClient(url, key);
  const { data, error } = await supabase.from("usuarios").select("id").limit(1);

  if (error) {
    const msg = error.message.toLowerCase();
    if (error.code === "PGRST125" || msg.includes("invalid path")) {
      console.error("❌ PGRST125 — URL base incorrecta.");
      console.error("   Verifique que NEXT_PUBLIC_SUPABASE_URL sea solo:");
      console.error("   https://xxxx.supabase.co");
      console.error("   Sin /rest/v1 ni barras finales extra.");
    } else if (msg.includes("does not exist") || error.code === "42P01") {
      console.error(
        "❌ Tabla `usuarios` no encontrada. Ejecute docs/database/supabase-schema.sql"
      );
    } else if (
      msg.includes("permission denied") ||
      msg.includes("row-level security") ||
      msg.includes("rls")
    ) {
      console.error("❌ Error de permisos / RLS al leer `usuarios`:", error.message);
    } else {
      console.error("❌ Error de conexión o consulta:", error.message);
      if (error.code) console.error("   Código:", error.code);
    }
    process.exit(1);
  }

  console.log("✅ Conexión correcta — tabla `usuarios` accesible");
  console.log(`   URL usada: ${url}`);
  console.log(`   Filas de muestra: ${data?.length ?? 0}`);
  if (appMode !== "SUPABASE") {
    console.log("   Para activar en la app: NEXT_PUBLIC_APP_MODE=SUPABASE");
  }
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err instanceof Error ? err.message : err);
  process.exit(1);
});
