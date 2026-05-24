import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { requireSupabase, extractEntityCodes } from "@/lib/supabase/helpers";
import type { MantenimientoRepository } from "@/repositories/mantenimiento.repository";
import type { ComentariosMantenimientoRepository } from "@/repositories/comentarios-mantenimiento.repository";
import type { ComentarioMantenimiento, CreateInput, Mantenimiento, UpdateInput } from "@/types";

const TABLE = "mantenimientos" as const;

function mapRow(r: Record<string, unknown>): Mantenimiento {
  return {
    id: r.id as string,
    code: r.code as string,
    inmuebleId: r.inmueble_id as string,
    titulo: r.titulo as string,
    descripcion: r.descripcion as string,
    prioridad: r.prioridad as Mantenimiento["prioridad"],
    estado: r.estado as Mantenimiento["estado"],
    tipoMantenimiento: r.tipo_mantenimiento as Mantenimiento["tipoMantenimiento"],
    tipoResponsabilidad: r.tipo_responsabilidad as Mantenimiento["tipoResponsabilidad"],
    valorEstimado: r.valor_estimado != null ? Number(r.valor_estimado) : undefined,
    valorFinal: r.valor_final != null ? Number(r.valor_final) : undefined,
    solicitadoPorId: r.solicitado_por_id as string,
    asignadoA: r.asignado_a as string | undefined,
    creadoEn: r.creado_en as string,
    fechaCierre: r.fecha_cierre as string | undefined,
    adjuntoUrl: r.adjunto_url as string | undefined,
  };
}

function toRow(i: Partial<Mantenimiento>) {
  return {
    inmueble_id: i.inmuebleId,
    titulo: i.titulo,
    descripcion: i.descripcion,
    prioridad: i.prioridad,
    estado: i.estado,
    tipo_mantenimiento: i.tipoMantenimiento,
    tipo_responsabilidad: i.tipoResponsabilidad,
    valor_estimado: i.valorEstimado,
    valor_final: i.valorFinal,
    solicitado_por_id: i.solicitadoPorId,
    asignado_a: i.asignadoA,
    creado_en: i.creadoEn,
    fecha_cierre: i.fechaCierre,
    adjunto_url: i.adjuntoUrl,
  };
}

function mapComentarioRow(r: Record<string, unknown>): ComentarioMantenimiento {
  return {
    id: r.id as string,
    mantenimientoId: r.mantenimiento_id as string,
    contratoId: r.contrato_id as string | undefined,
    inmuebleId: r.inmueble_id as string,
    usuarioId: r.usuario_id as string,
    usuarioNombre: r.usuario_nombre as string,
    usuarioEmail: r.usuario_email as string,
    usuarioRol: r.usuario_rol as ComentarioMantenimiento["usuarioRol"],
    comentario: r.comentario as string,
    adjuntoUrl: r.adjunto_url as string | undefined,
    fechaCreacion: r.fecha_creacion as string,
  };
}

export const supabaseMaintenanceRepository: MantenimientoRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from(TABLE).select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from(TABLE).select("*").eq("id", id).maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from(TABLE).select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.mantenimiento, extractEntityCodes(existing));
    const { data, error } = await sb
      .from(TABLE)
      .insert({ ...toRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb.from(TABLE).update(toRow(input)).eq("id", id).select().maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    return !error;
  },
};

export const supabaseComentariosMantenimientoRepository: ComentariosMantenimientoRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("mantenimiento_comentarios").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapComentarioRow(r as Record<string, unknown>));
  },
  findByMantenimientoId: async (mantenimientoId) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("mantenimiento_comentarios")
      .select("*")
      .eq("mantenimiento_id", mantenimientoId)
      .order("fecha_creacion", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => mapComentarioRow(r as Record<string, unknown>));
  },
  create: async (data) => {
    const sb = requireSupabase();
    const row = {
      mantenimiento_id: data.mantenimientoId,
      contrato_id: data.contratoId,
      inmueble_id: data.inmuebleId,
      usuario_id: data.usuarioId,
      usuario_nombre: data.usuarioNombre,
      usuario_email: data.usuarioEmail,
      usuario_rol: data.usuarioRol,
      comentario: data.comentario,
      adjunto_url: data.adjuntoUrl,
      fecha_creacion: new Date().toISOString(),
    };
    const { data: inserted, error } = await sb
      .from("mantenimiento_comentarios")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return mapComentarioRow(inserted as Record<string, unknown>);
  },
};

export const mantenimientoSupabaseRepository = supabaseMaintenanceRepository;
export const comentariosMantenimientoSupabaseRepository = supabaseComentariosMantenimientoRepository;
