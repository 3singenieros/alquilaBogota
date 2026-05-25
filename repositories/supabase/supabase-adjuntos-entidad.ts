import { requireSupabase } from "@/lib/supabase/helpers";
import { urlPrimeraAdjunto } from "@/lib/archivos-adjuntos";
import { mapArchivoAdjuntoRow } from "@/repositories/supabase/supabase-file.repository";
import type { ArchivoAdjunto } from "@/types";

/** Adjuntos por entidad_id desde archivo_adjunto (Storage metadata). */
export async function fetchAdjuntosPorEntidades(
  entidadTipo: string,
  entidadIds: string[]
): Promise<Map<string, ArchivoAdjunto[]>> {
  const map = new Map<string, ArchivoAdjunto[]>();
  for (const id of entidadIds) map.set(id, []);
  if (entidadIds.length === 0) return map;

  const sb = requireSupabase();
  const { data, error } = await sb
    .from("archivo_adjunto")
    .select("*")
    .eq("entidad_tipo", entidadTipo)
    .in("entidad_id", entidadIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const entidadId = row.entidad_id as string;
    const adjunto = mapArchivoAdjuntoRow(row as Record<string, unknown>);
    const list = map.get(entidadId) ?? [];
    if (!list.some((a) => a.id === adjunto.id)) {
      list.push(adjunto);
    }
    map.set(entidadId, list);
  }

  return map;
}

export function pagoConComprobantes<
  T extends { id: string; comprobanteUrl?: string },
>(pago: T, map: Map<string, ArchivoAdjunto[]>) {
  const comprobantesAdjuntos = map.get(pago.id) ?? [];
  const comprobanteUrl =
    pago.comprobanteUrl ?? urlPrimeraAdjunto(comprobantesAdjuntos);
  return { comprobantesAdjuntos, comprobanteUrl };
}

export const pagoServicioConComprobantes = pagoConComprobantes;

export type AdjuntosMantenimiento = {
  evidenciasAdjuntas: ArchivoAdjunto[];
  documentosCierreAdjuntos: ArchivoAdjunto[];
  adjuntoUrl?: string;
};

/** Evidencias y documentos de cierre vía archivo_adjunto + mantenimiento_documentos. */
export async function fetchAdjuntosMantenimientoPorIds(
  mantenimientoIds: string[]
): Promise<Map<string, AdjuntosMantenimiento>> {
  const map = new Map<string, AdjuntosMantenimiento>();
  for (const id of mantenimientoIds) {
    map.set(id, { evidenciasAdjuntas: [], documentosCierreAdjuntos: [] });
  }
  if (mantenimientoIds.length === 0) return map;

  const adjMap = await fetchAdjuntosPorEntidades("MANTENIMIENTO", mantenimientoIds);
  const sb = requireSupabase();
  const { data: links, error } = await sb
    .from("mantenimiento_documentos")
    .select("mantenimiento_id, archivo_id, tipo_documento")
    .in("mantenimiento_id", mantenimientoIds);
  if (error) throw error;

  const tipoPorArchivo = new Map<string, string>();
  for (const row of links ?? []) {
    tipoPorArchivo.set(
      row.archivo_id as string,
      (row.tipo_documento as string) || "EVIDENCIA"
    );
  }

  for (const mntId of mantenimientoIds) {
    const archivos = adjMap.get(mntId) ?? [];
    const evidenciasAdjuntas: ArchivoAdjunto[] = [];
    const documentosCierreAdjuntos: ArchivoAdjunto[] = [];
    for (const a of archivos) {
      const tipo = tipoPorArchivo.get(a.id) ?? "EVIDENCIA";
      if (tipo === "CIERRE") documentosCierreAdjuntos.push(a);
      else evidenciasAdjuntas.push(a);
    }
    const adjuntoUrl =
      urlPrimeraAdjunto(evidenciasAdjuntas) ?? urlPrimeraAdjunto(documentosCierreAdjuntos);
    map.set(mntId, { evidenciasAdjuntas, documentosCierreAdjuntos, adjuntoUrl });
  }

  return map;
}

export function mantenimientoConAdjuntos<
  T extends { id: string; adjuntoUrl?: string },
>(mantenimiento: T, map: Map<string, AdjuntosMantenimiento>) {
  const data = map.get(mantenimiento.id) ?? {
    evidenciasAdjuntas: [],
    documentosCierreAdjuntos: [],
  };
  return {
    evidenciasAdjuntas: data.evidenciasAdjuntas,
    documentosCierreAdjuntos: data.documentosCierreAdjuntos,
    adjuntoUrl: mantenimiento.adjuntoUrl ?? data.adjuntoUrl,
  };
}
