import { seedNoRenovacion } from "@/data/mock/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";

export interface NoRenovacionRepository {
  findAll(): Promise<NoRenovacion[]>;
  findById(id: string): Promise<NoRenovacion | null>;
  create(data: CreateInput<NoRenovacion>): Promise<NoRenovacion>;
  update(id: string, data: UpdateInput<NoRenovacion>): Promise<NoRenovacion | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedNoRenovacion);

export const noRenovacionMockRepository: NoRenovacionRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => mockStore.create({ ...data, id: newId("nr") }),
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const noRenovacionSupabaseRepository: NoRenovacionRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("no_renovacion").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("no_renovacion").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("no_renovacion").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("no_renovacion").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
  delete: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return false;
    const { error } = await sb.from("no_renovacion").delete().eq("id", id);
    return !error;
  },
};

function mapRow(r: Record<string, unknown>): NoRenovacion {
  return {
    id: r.id as string,
    contratoId: r.contrato_id as string,
    motivo: r.motivo as string,
    fechaSolicitud: r.fecha_solicitud as string,
    estado: r.estado as NoRenovacion["estado"],
    documentoUrl: r.documento_url as string | undefined,
    solicitadoPorId: r.solicitado_por_id as string,
  };
}

function toRow(i: Partial<NoRenovacion>) {
  return {
    contrato_id: i.contratoId,
    motivo: i.motivo,
    fecha_solicitud: i.fechaSolicitud,
    estado: i.estado,
    documento_url: i.documentoUrl,
    solicitado_por_id: i.solicitadoPorId,
  };
}
