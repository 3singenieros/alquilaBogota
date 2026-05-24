import type { StorageBucketKey } from "@/lib/config";

/** Rutas sugeridas dentro de cada bucket de Supabase Storage. */
export const STORAGE_PATHS = {
  contratoDocumento: (contratoCode: string, filename: string) =>
    `${contratoCode}/documentos/${filename}`,
  pagoComprobante: (contratoCode: string, pagoCode: string, filename: string) =>
    `${contratoCode}/pagos/${pagoCode}/${filename}`,
  servicioComprobante: (contratoCode: string, pagoCode: string, filename: string) =>
    `${contratoCode}/servicios/${pagoCode}/${filename}`,
  mantenimientoEvidencia: (mantenimientoCode: string, filename: string) =>
    `${mantenimientoCode}/evidencias/${filename}`,
  mantenimientoCierre: (mantenimientoCode: string, filename: string) =>
    `${mantenimientoCode}/cierre/${filename}`,
  noRenovacionDocumento: (expedienteCode: string, filename: string) =>
    `${expedienteCode}/documentos/${filename}`,
  noRenovacionEvidenciaEnvio: (expedienteCode: string, filename: string) =>
    `${expedienteCode}/envio/${filename}`,
  evidenciaGenerica: (modulo: string, entidadCode: string, filename: string) =>
    `${modulo}/${entidadCode}/${filename}`,
} as const;

export function resolveBucketForModule(modulo: StorageBucketKey | string): StorageBucketKey {
  const map: Record<string, StorageBucketKey> = {
    contratos: "contratos",
    pagos: "pagos",
    servicios: "servicios",
    mantenimiento: "mantenimiento",
    "no-renovacion": "noRenovacion",
    noRenovacion: "noRenovacion",
    evidencias: "evidencias",
  };
  return map[modulo] ?? "evidencias";
}
