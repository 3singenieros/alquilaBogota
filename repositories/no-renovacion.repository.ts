import { seedNoRenovacion } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
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
  create: async (data) => {
    const item = buildMockEntity<NoRenovacion>(
      ENTITY_CODE_PREFIX.noRenovacion,
      data,
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
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
    const { data: existing } = await sb.from("no_renovacion").select("code");
    const code = generateUniqueCode(
      ENTITY_CODE_PREFIX.noRenovacion,
      (existing ?? []).map((r) => r.code as string)
    );
    const row = { ...toRow(input), code, datos: input };
    const { data, error } = await sb.from("no_renovacion").insert(row).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb
      .from("no_renovacion")
      .update({ ...toRow(input), datos: input })
      .eq("id", id)
      .select()
      .single();
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
  if (r.datos && typeof r.datos === "object") {
    const datos = r.datos as NoRenovacion;
    return {
      ...datos,
      id: (r.id as string) ?? datos.id,
      code: (r.code as string) ?? datos.code,
    };
  }
  return r as unknown as NoRenovacion;
}

function toRow(i: Partial<NoRenovacion>) {
  return {
    contrato_id: i.contratoId,
    motivo: i.motivo,
    estado: i.estado,
    datos: i,
  };
}
