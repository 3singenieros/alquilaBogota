import { isMockMode } from "@/config/app-mode";

export { getAppMode, isMockMode, isSupabaseMode, hasSupabaseEnv, type AppMode } from "@/config/app-mode";

/** true cuando la app usa repositorios mock en memoria. */
export const USE_MOCK_DATA = isMockMode();

/** Buckets de Supabase Storage (crear en Dashboard > Storage). */
export const STORAGE_BUCKETS = {
  contratos: "contratos",
  pagos: "pagos",
  servicios: "servicios",
  mantenimiento: "mantenimiento",
  noRenovacion: "no-renovacion",
  evidencias: "evidencias",
  /** @deprecated Usar buckets específicos por módulo */
  comprobantes: "pagos",
  documentos: "contratos",
} as const;

export type StorageBucketKey = keyof typeof STORAGE_BUCKETS;
