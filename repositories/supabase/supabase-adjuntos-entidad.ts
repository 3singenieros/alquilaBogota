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
