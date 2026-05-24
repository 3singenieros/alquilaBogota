import { requireSupabase } from "@/lib/supabase/helpers";
import type { ArchivoAdjunto } from "@/types";
import type { DbWrite } from "@/lib/supabase/types";

export interface FileRepository {
  findById(id: string): Promise<ArchivoAdjunto | null>;
  create(data: Omit<ArchivoAdjunto, "id"> & { id?: string }): Promise<ArchivoAdjunto>;
  linkToContrato(contratoId: string, archivoId: string, tipo?: string): Promise<void>;
  linkToMantenimiento(mantenimientoId: string, archivoId: string, tipo?: string): Promise<void>;
}

function mapRow(r: Record<string, unknown>): ArchivoAdjunto {
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    tipo: r.tipo as string | undefined,
    tamano: r.tamano != null ? Number(r.tamano) : undefined,
    bucket: r.bucket as string | undefined,
    path: r.path as string | undefined,
    publicUrl: r.public_url as string | undefined,
    urlSimulada: r.url_simulada as string | undefined,
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

function toRow(a: Partial<ArchivoAdjunto>): DbWrite {
  return {
    id: a.id,
    nombre: a.nombre!,
    tipo: a.tipo,
    tamano: a.tamano,
    bucket: a.bucket,
    path: a.path,
    public_url: a.publicUrl,
    url_simulada: a.urlSimulada,
    descripcion: a.descripcion,
    uploaded_at: a.uploadedAt,
    uploaded_by: a.uploadedBy,
    cargado_por_id: a.cargadoPorId,
    cargado_por_nombre: a.cargadoPorNombre,
    cargado_por_email: a.cargadoPorEmail,
    cargado_por_rol: a.cargadoPorRol,
    fecha_carga: a.fechaCarga ?? new Date().toISOString(),
  };
}

export const supabaseFileRepository: FileRepository = {
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("archivo_adjunto").select("*").eq("id", id).maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
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
  linkToContrato: async (contratoId, archivoId, tipo) => {
    const sb = requireSupabase();
    const { error } = await sb.from("contrato_documentos").insert({
      contrato_id: contratoId,
      archivo_id: archivoId,
      tipo_documento: tipo,
    });
    if (error) throw error;
  },
  linkToMantenimiento: async (mantenimientoId, archivoId, tipo) => {
    const sb = requireSupabase();
    const { error } = await sb.from("mantenimiento_documentos").insert({
      mantenimiento_id: mantenimientoId,
      archivo_id: archivoId,
      tipo_documento: tipo,
    });
    if (error) throw error;
  },
};

export function getFileRepository(): FileRepository {
  return supabaseFileRepository;
}
