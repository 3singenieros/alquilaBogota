import { requireSupabase } from "@/lib/supabase/helpers";
import type { TrazabilidadRepository } from "@/repositories/trazabilidad.repository";
import type { EventoTrazabilidad, RegistrarEventoInput } from "@/types/trazabilidad";

function mapRow(r: Record<string, unknown>): EventoTrazabilidad {
  return {
    id: r.id as string,
    entidadTipo: r.entidad_tipo as EventoTrazabilidad["entidadTipo"],
    entidadId: r.entidad_id as string,
    contratoId: r.contrato_id as string | undefined,
    inmuebleId: r.inmueble_id as string | undefined,
    pagoId: r.pago_id as string | undefined,
    usuarioAfectadoId: r.usuario_afectado_id as string | undefined,
    accion: r.accion as EventoTrazabilidad["accion"],
    estadoAnterior: r.estado_anterior as string | undefined,
    estadoNuevo: r.estado_nuevo as string | undefined,
    descripcion: r.descripcion as string,
    usuarioId: r.usuario_id as string,
    usuarioNombre: r.usuario_nombre as string,
    usuarioEmail: r.usuario_email as string,
    usuarioRol: r.usuario_rol as EventoTrazabilidad["usuarioRol"],
    fechaHora: r.fecha_hora as string,
    valoresAnteriores: r.valores_anteriores as Record<string, unknown> | undefined,
    valoresNuevos: r.valores_nuevos as Record<string, unknown> | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
  };
}

function toRow(e: Partial<EventoTrazabilidad>) {
  return {
    entidad_tipo: e.entidadTipo,
    entidad_id: e.entidadId,
    contrato_id: e.contratoId,
    inmueble_id: e.inmuebleId,
    pago_id: e.pagoId,
    usuario_afectado_id: e.usuarioAfectadoId,
    accion: e.accion,
    estado_anterior: e.estadoAnterior,
    estado_nuevo: e.estadoNuevo,
    descripcion: e.descripcion,
    usuario_id: e.usuarioId,
    usuario_nombre: e.usuarioNombre,
    usuario_email: e.usuarioEmail,
    usuario_rol: e.usuarioRol,
    fecha_hora: e.fechaHora ?? new Date().toISOString(),
    valores_anteriores: e.valoresAnteriores,
    valores_nuevos: e.valoresNuevos,
    metadata: e.metadata,
  };
}

export const supabaseTrazabilidadRepository: TrazabilidadRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("evento_trazabilidad")
      .select("*")
      .order("fecha_hora", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("evento_trazabilidad").select("*").eq("id", id).maybeSingle();
    return data ? mapRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("evento_trazabilidad")
      .insert(toRow(input))
      .select()
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },
};

export const trazabilidadSupabaseRepository = supabaseTrazabilidadRepository;
