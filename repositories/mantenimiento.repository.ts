import { seedMantenimiento } from "@/data/mock/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { CreateInput, Mantenimiento, UpdateInput } from "@/types";

export interface MantenimientoRepository {
  findAll(): Promise<Mantenimiento[]>;
  findById(id: string): Promise<Mantenimiento | null>;
  create(data: CreateInput<Mantenimiento>): Promise<Mantenimiento>;
  update(id: string, data: UpdateInput<Mantenimiento>): Promise<Mantenimiento | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedMantenimiento);

export const mantenimientoMockRepository: MantenimientoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) =>
    mockStore.create({
      ...data,
      id: newId("mnt"),
      creadoEn: data.creadoEn ?? new Date().toISOString().slice(0, 10),
    }),
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const mantenimientoSupabaseRepository: MantenimientoRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("mantenimiento").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("mantenimiento").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("mantenimiento").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("mantenimiento").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
  delete: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return false;
    const { error } = await sb.from("mantenimiento").delete().eq("id", id);
    return !error;
  },
};

function mapRow(r: Record<string, unknown>): Mantenimiento {
  return {
    id: r.id as string,
    inmuebleId: r.inmueble_id as string,
    titulo: r.titulo as string,
    descripcion: r.descripcion as string,
    prioridad: r.prioridad as Mantenimiento["prioridad"],
    estado: r.estado as Mantenimiento["estado"],
    solicitadoPorId: r.solicitado_por_id as string,
    asignadoA: r.asignado_a as string | undefined,
    creadoEn: r.creado_en as string,
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
    solicitado_por_id: i.solicitadoPorId,
    asignado_a: i.asignadoA,
    creado_en: i.creadoEn,
    adjunto_url: i.adjuntoUrl,
  };
}
