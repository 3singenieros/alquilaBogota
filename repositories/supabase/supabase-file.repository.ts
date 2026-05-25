import { nullableFkId, requireSupabase } from "@/lib/supabase/helpers";
import type {
  ArchivoAdjuntoRecord,
  FileRepository,
} from "@/repositories/file.repository";
import type { ArchivoAdjunto } from "@/types";
import type { DbWrite } from "@/lib/supabase/types";

function mapRow(r: Record<string, unknown>): ArchivoAdjuntoRecord {
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    tipo: r.tipo as string | undefined,
    tamano: r.tamano != null ? Number(r.tamano) : undefined,
    bucket: r.bucket as string | undefined,
    path: r.path as string | undefined,
    publicUrl: r.public_url as string | undefined,
    urlSimulada: r.url_simulada as string | undefined,
    entidadTipo: r.entidad_tipo as string | undefined,
    entidadId: r.entidad_id as string | undefined,
    contratoId: r.contrato_id as string | undefined,
    inmuebleId: r.inmueble_id as string | undefined,
    descripcion: r.descripcion as string | undefined,
    uploadedAt: r.uploaded_at as string | undefined,
    uploadedBy: r.uploaded_by as string | undefined,
    fechaCarga: r.fecha_carga as string,
    cargadoPorId: r.cargado_por_id as string | undefined,
    cargadoPorNombre: r.cargado_por_nombre as string | undefined,
    cargadoPorEmail: r.cargado_por_email as string | undefined,
    cargadoPorRol: r.cargado_por_rol as ArchivoAdjunto["cargadoPorRol"],
  };
}

function toRow(a: Partial<ArchivoAdjuntoRecord>): DbWrite {
  return {
    id: a.id,
    nombre: a.nombre!,
    tipo: a.tipo,
    tamano: a.tamano,
    bucket: a.bucket,
    path: a.path,
    public_url: a.publicUrl,
    url_simulada: a.urlSimulada,
    entidad_tipo: a.entidadTipo,
    entidad_id: a.entidadId,
    contrato_id: nullableFkId(a.contratoId),
    inmueble_id: nullableFkId(a.inmuebleId),
    descripcion: a.descripcion,
    uploaded_at: a.uploadedAt,
    uploaded_by: nullableFkId(a.uploadedBy),
    cargado_por_id: nullableFkId(a.cargadoPorId),
    cargado_por_nombre: a.cargadoPorNombre,
    cargado_por_email: a.cargadoPorEmail,
    cargado_por_rol: a.cargadoPorRol,
    fecha_carga: a.fechaCarga ?? new Date().toISOString(),
  };
}

export const fileSupabaseRepository: FileRepository = {
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("archivo_adjunto").select("*").eq("id", id).maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  findByEntidad: async (entidadTipo, entidadId) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("archivo_adjunto")
      .select("*")
      .eq("entidad_tipo", entidadTipo)
      .eq("entidad_id", entidadId);
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },
  create: async (data) => {
    const sb = requireSupabase();
    const { data: row, error } = await sb
      .from("archivo_adjunto")
      .insert(toRow(data))
      .select()
      .single();
    if (error) throw error;
    return mapRow(row as Record<string, unknown>);
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from("archivo_adjunto").delete().eq("id", id);
    return !error;
  },
  linkToContrato: async (contratoId, archivoId, tipo) => {
    const sb = requireSupabase();
    const { error } = await sb.from("contrato_documentos").upsert(
      {
        contrato_id: contratoId,
        archivo_id: archivoId,
        tipo_documento: tipo,
      },
      { onConflict: "contrato_id,archivo_id" }
    );
    if (error) throw error;
  },
  linkToMantenimiento: async (mantenimientoId, archivoId, tipo) => {
    const sb = requireSupabase();
    const { error } = await sb.from("mantenimiento_documentos").upsert(
      {
        mantenimiento_id: mantenimientoId,
        archivo_id: archivoId,
        tipo_documento: tipo,
      },
      { onConflict: "mantenimiento_id,archivo_id" }
    );
    if (error) throw error;
  },
};

export const supabaseFileRepository = fileSupabaseRepository;

export function mapArchivoAdjuntoRow(r: Record<string, unknown>): ArchivoAdjuntoRecord {
  return mapRow(r);
}
