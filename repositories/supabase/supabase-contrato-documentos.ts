import { requireSupabase } from "@/lib/supabase/helpers";
import { mapArchivoAdjuntoRow } from "@/repositories/supabase/supabase-file.repository";
import type { ArchivoAdjunto } from "@/types";

/** Documentos de contrato vía tabla puente y/o entidad en archivo_adjunto. */
export async function fetchDocumentosPorContratos(
  contratoIds: string[]
): Promise<Map<string, ArchivoAdjunto[]>> {
  const map = new Map<string, ArchivoAdjunto[]>();
  for (const id of contratoIds) map.set(id, []);
  if (contratoIds.length === 0) return map;

  const sb = requireSupabase();

  const { data: links, error: linkErr } = await sb
    .from("contrato_documentos")
    .select("contrato_id, archivo_adjunto(*)")
    .in("contrato_id", contratoIds);
  if (linkErr) throw linkErr;

  for (const row of links ?? []) {
    const contratoId = row.contrato_id as string;
    const raw = row.archivo_adjunto as Record<string, unknown> | Record<string, unknown>[] | null;
    const archivo = Array.isArray(raw) ? raw[0] : raw;
    if (!archivo) continue;
    pushUnique(map, contratoId, mapArchivoAdjuntoRow(archivo));
  }

  const { data: direct, error: directErr } = await sb
    .from("archivo_adjunto")
    .select("*")
    .eq("entidad_tipo", "CONTRATO")
    .in("entidad_id", contratoIds);
  if (directErr) throw directErr;

  for (const row of direct ?? []) {
    const contratoId = row.entidad_id as string;
    pushUnique(map, contratoId, mapArchivoAdjuntoRow(row as Record<string, unknown>));
  }

  return map;
}

function pushUnique(
  map: Map<string, ArchivoAdjunto[]>,
  contratoId: string,
  adjunto: ArchivoAdjunto
) {
  const list = map.get(contratoId) ?? [];
  if (!list.some((a) => a.id === adjunto.id)) {
    list.push(adjunto);
  }
  map.set(contratoId, list);
}

export function contratoConDocumentos(
  contrato: { id: string; documentoUrl?: string },
  map: Map<string, ArchivoAdjunto[]>
) {
  const documentosAdjuntos = map.get(contrato.id) ?? [];
  const documentoUrl =
    contrato.documentoUrl ??
    documentosAdjuntos[0]?.publicUrl ??
    documentosAdjuntos[0]?.urlSimulada;
  return { documentosAdjuntos, documentoUrl };
}
