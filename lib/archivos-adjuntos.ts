import { ENTITY_CODE_PREFIX } from "@/lib/entity-codes";
import { newId } from "@/repositories/mock-store";
import type { ArchivoAdjunto, Rol } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";

export type CargadoPorAdjunto = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

export function archivosDesdeFiles(
  files: FileList | File[],
  cargadoPor?: CargadoPorAdjunto
): ArchivoAdjunto[] {
  const list = Array.from(files);
  const ahora = new Date().toISOString();
  return list.map((file) => ({
    id: newId(ENTITY_CODE_PREFIX.archivoAdjunto),
    nombre: file.name,
    tipo: file.type || undefined,
    tamano: file.size,
    urlSimulada: `archivo:${file.name}`,
    fechaCarga: ahora,
    cargadoPorId: cargadoPor?.id,
    cargadoPorNombre: cargadoPor?.nombre,
    cargadoPorEmail: cargadoPor?.email,
    cargadoPorRol: cargadoPor?.rol,
  }));
}

export function archivosDesdeLegacyUrl(url?: string): ArchivoAdjunto[] {
  if (!url?.trim()) return [];
  const nombre = url.replace(/^archivo:/, "").split("/").pop() ?? url;
  return [
    {
      id: newId(ENTITY_CODE_PREFIX.archivoAdjunto),
      nombre,
      urlSimulada: url,
      fechaCarga: new Date().toISOString(),
    },
  ];
}

export function urlPrimeraAdjunto(adjuntos?: ArchivoAdjunto[]): string | undefined {
  return adjuntos?.[0]?.urlSimulada;
}

export function combinarAdjuntos(
  existentes: ArchivoAdjunto[] | undefined,
  nuevos: ArchivoAdjunto[] | undefined
): ArchivoAdjunto[] {
  return [...(existentes ?? []), ...(nuevos ?? [])];
}

export function totalAdjuntos(...listas: (ArchivoAdjunto[] | undefined)[]): number {
  return listas.reduce((sum, l) => sum + (l?.length ?? 0), 0);
}

export function parseAdjuntosJson(raw: unknown): ArchivoAdjunto[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ArchivoAdjunto[];
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as ArchivoAdjunto[]) : [];
  } catch {
    return [];
  }
}

export function prepararComprobantes(
  adjuntos?: ArchivoAdjunto[],
  legacyUrl?: string
): { comprobantesAdjuntos: ArchivoAdjunto[]; comprobanteUrl?: string } {
  const comprobantesAdjuntos =
    adjuntos && adjuntos.length > 0
      ? adjuntos
      : archivosDesdeLegacyUrl(legacyUrl);
  return {
    comprobantesAdjuntos,
    comprobanteUrl: legacyUrl ?? urlPrimeraAdjunto(comprobantesAdjuntos),
  };
}

export function prepararDocumentosContrato(
  adjuntos?: ArchivoAdjunto[],
  legacyUrl?: string
): { documentosAdjuntos: ArchivoAdjunto[]; documentoUrl?: string } {
  const documentosAdjuntos =
    adjuntos && adjuntos.length > 0
      ? adjuntos
      : archivosDesdeLegacyUrl(legacyUrl);
  return {
    documentosAdjuntos,
    documentoUrl: legacyUrl ?? urlPrimeraAdjunto(documentosAdjuntos),
  };
}

export function prepararEvidenciasMantenimiento(
  adjuntos?: ArchivoAdjunto[],
  legacyUrl?: string
): { evidenciasAdjuntas: ArchivoAdjunto[]; adjuntoUrl?: string } {
  const evidenciasAdjuntas =
    adjuntos && adjuntos.length > 0
      ? adjuntos
      : archivosDesdeLegacyUrl(legacyUrl);
  return {
    evidenciasAdjuntas,
    adjuntoUrl: legacyUrl ?? urlPrimeraAdjunto(evidenciasAdjuntas),
  };
}

export function debeRegistrarTrazabilidadAdjuntos(adjuntos: ArchivoAdjunto[]): boolean {
  return adjuntos.length > 0 && adjuntos.every((a) => !a.bucket && !a.path);
}

export function metadataAdjuntosTrazabilidad(
  adjuntos: ArchivoAdjunto[],
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    cantidadArchivos: adjuntos.length,
    nombresArchivos: adjuntos.map((a) => a.nombre),
    bucket: adjuntos.map((a) => a.bucket).filter(Boolean),
    paths: adjuntos.map((a) => a.path).filter(Boolean),
    entidadTipo,
    entidadId,
    ...extra,
  };
}

/** Listado plano para futuros reportes PDF. */
export function listadoAdjuntosParaReporte(adjuntos: ArchivoAdjunto[]) {
  return adjuntos.map((a) => ({
    nombre: a.nombre,
    fechaCarga: a.fechaCarga,
    cargadoPorNombre: a.cargadoPorNombre,
    cargadoPorRol: a.cargadoPorRol,
    urlSimulada: a.urlSimulada,
    descripcion: a.descripcion,
  }));
}
