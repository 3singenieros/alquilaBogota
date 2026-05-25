/**
 * Verifica Supabase Storage: variables, buckets y URLs firmadas.
 * Uso: npm run check:storage
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createSupabaseCliClient } from "./supabase-cli-client";
import { STORAGE_BUCKETS } from "../lib/config";
import {
  getSupabaseAnonKey,
  validateSupabaseUrl,
} from "../lib/supabase/env";


config({ path: resolve(process.cwd(), ".env.local") });

const REQUIRED_BUCKETS = [
  STORAGE_BUCKETS.contratos,
  STORAGE_BUCKETS.pagos,
  STORAGE_BUCKETS.servicios,
  STORAGE_BUCKETS.mantenimiento,
  STORAGE_BUCKETS.noRenovacion,
  STORAGE_BUCKETS.evidencias,
];

function getAppMode(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_MODE?.trim().toUpperCase();
  if (explicit === "MOCK" || explicit === "SUPABASE") return explicit;
  return "MOCK";
}

function getServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || key.includes("REEMPLAZAR")) return null;
  return key;
}

/** listBuckets() solo funciona con service role; con anon devuelve []. */
async function listBucketNames(
  url: string,
  anonKey: string
): Promise<Set<string> | null> {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) return null;

  const admin = createSupabaseCliClient(url, serviceKey);
  const { data, error } = await admin.storage.listBuckets();
  if (error) {
    console.warn(`ℹ️  No se pudo listar buckets con service role: ${error.message}`);
    return null;
  }
  return new Set((data ?? []).map((b) => b.name));
}

async function probeBucket(
  supabase: ReturnType<typeof createSupabaseCliClient>,
  bucketName: string
): Promise<{ ok: true } | { ok: false; reason: "missing" | "denied"; message: string }> {
  const { error } = await supabase.storage.from(bucketName).list("", { limit: 1 });
  if (!error) return { ok: true };

  const msg = error.message.toLowerCase();
  if (
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("bucket") && msg.includes("exist")
  ) {
    return { ok: false, reason: "missing", message: error.message };
  }
  return { ok: false, reason: "denied", message: error.message };
}

async function main() {
  const appMode = getAppMode();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = getSupabaseAnonKey() ?? "";

  console.log(`[check:storage] APP_MODE=${appMode}`);

  if (!rawUrl || !key) {
    console.error(
      "❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
    process.exit(1);
  }

  const urlCheck = validateSupabaseUrl(rawUrl);
  if (!urlCheck.ok) {
    console.error(`❌ ${urlCheck.error}`);
    process.exit(1);
  }

  const url = urlCheck.url;
  console.log(`[check:storage] URL base: ${url}`);

  const supabase = createSupabaseCliClient(url, key);

  const listedNames = await listBucketNames(url, key);
  if (listedNames) {
    console.log("ℹ️  Verificando buckets (service role)…");
  } else {
    console.log(
      "ℹ️  Verificando buckets uno a uno (anon key no puede listar todos los buckets)…"
    );
  }

  let missing = false;
  let denied = false;

  for (const name of REQUIRED_BUCKETS) {
    if (listedNames?.has(name)) {
      console.log(`✅ Bucket "${name}" existe`);
      continue;
    }

    if (listedNames && !listedNames.has(name)) {
      console.error(`❌ Falta bucket "${name}"`);
      missing = true;
      continue;
    }

    const probe = await probeBucket(supabase, name);
    if (probe.ok) {
      console.log(`✅ Bucket "${name}" accesible`);
      continue;
    }
    if (probe.reason === "missing") {
      console.error(`❌ Falta bucket "${name}"`);
      missing = true;
    } else {
      console.error(`❌ Bucket "${name}" sin acceso: ${probe.message}`);
      denied = true;
    }
  }

  if (missing) {
    console.error("\n   Cree los buckets con docs/database/supabase-storage-setup.sql");
    console.error("   (Supabase Dashboard → SQL Editor → Run)");
    process.exit(1);
  }

  if (denied) {
    console.error("\n   Los buckets existen pero la anon key no puede acceder.");
    console.error("   Ejecute las políticas en docs/database/supabase-storage-setup.sql");
    process.exit(1);
  }

  const probeBucketName = STORAGE_BUCKETS.evidencias;
  const probePath = `_check/${Date.now()}-probe.txt`;
  const probeBody = "storage-check-probe";

  const { error: uploadError } = await supabase.storage
    .from(probeBucketName)
    .upload(probePath, probeBody, { upsert: true, contentType: "text/plain" });

  if (uploadError) {
    console.error(`❌ No se pudo subir archivo de prueba a "${probeBucketName}":`, uploadError.message);
    console.error("   Revise políticas de Storage en supabase-storage-setup.sql");
    process.exit(1);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(probeBucketName)
    .createSignedUrl(probePath, 60);

  if (signError || !signed?.signedUrl) {
    console.error("❌ No se pudo generar signed URL:", signError?.message ?? "sin URL");
    process.exit(1);
  }

  console.log(`✅ Signed URL generada (${probeBucketName}/${probePath})`);

  await supabase.storage.from(probeBucketName).remove([probePath]);

  console.log("\n✅ Storage operativo — buckets y signed URLs OK");
  if (appMode !== "SUPABASE") {
    console.log("   Para activar en la app: NEXT_PUBLIC_APP_MODE=SUPABASE");
  }
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err instanceof Error ? err.message : err);
  process.exit(1);
});
