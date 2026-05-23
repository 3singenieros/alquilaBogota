import { seedTrazabilidad } from "@/data/mock/seed-trazabilidad";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { EventoTrazabilidad, RegistrarEventoInput } from "@/types/trazabilidad";

export interface TrazabilidadRepository {
  findAll(): Promise<EventoTrazabilidad[]>;
  findById(id: string): Promise<EventoTrazabilidad | null>;
  create(data: RegistrarEventoInput): Promise<EventoTrazabilidad>;
}

const mockStore = createMockStore(seedTrazabilidad);

export const trazabilidadMockRepository: TrazabilidadRepository = {
  findAll: async () =>
    [...mockStore.getAll()].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item: EventoTrazabilidad = {
      id: newId("trz"),
      fechaHora: new Date().toISOString(),
      usuarioId: data.usuarioId ?? "system",
      usuarioNombre: data.usuarioNombre ?? "Sistema",
      usuarioEmail: data.usuarioEmail ?? "system@app.local",
      usuarioRol: data.usuarioRol ?? "SISTEMA",
      entidadTipo: data.entidadTipo,
      entidadId: data.entidadId,
      contratoId: data.contratoId,
      inmuebleId: data.inmuebleId,
      pagoId: data.pagoId,
      usuarioAfectadoId: data.usuarioAfectadoId,
      accion: data.accion,
      estadoAnterior: data.estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      descripcion: data.descripcion,
      valoresAnteriores: data.valoresAnteriores,
      valoresNuevos: data.valoresNuevos,
      metadata: data.metadata,
    };
    return mockStore.create(item);
  },
};

export const trazabilidadSupabaseRepository: TrazabilidadRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("trazabilidad").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("trazabilidad").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("trazabilidad").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
};

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
