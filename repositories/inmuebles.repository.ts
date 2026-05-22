import { seedInmuebles } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

export interface InmueblesRepository {
  findAll(): Promise<Inmueble[]>;
  findById(id: string): Promise<Inmueble | null>;
  create(data: CreateInput<Inmueble>): Promise<Inmueble>;
  update(id: string, data: UpdateInput<Inmueble>): Promise<Inmueble | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedInmuebles);

export const inmueblesMockRepository: InmueblesRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<Inmueble>(
      ENTITY_CODE_PREFIX.inmueble,
      {
        ...data,
        creadoEn: data.creadoEn ?? new Date().toISOString().slice(0, 10),
      },
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const inmueblesSupabaseRepository: InmueblesRepository = {
  findAll: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("inmuebles")
      .select("*")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from("inmuebles").select("*").eq("id", id).single();
    if (error) return null;
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase no configurado");
    const { data: existing } = await supabase.from("inmuebles").select("code");
    const codes = (existing ?? []).map((r) => r.code as string);
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.inmueble, codes);
    const row = { ...toRow(input), code };
    const { data, error } = await supabase.from("inmuebles").insert(row).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("inmuebles")
      .update(toRow(input))
      .eq("id", id)
      .select()
      .single();
    if (error) return null;
    return mapRow(data);
  },
  delete: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from("inmuebles").delete().eq("id", id);
    return !error;
  },
};

function mapRow(row: Record<string, unknown>): Inmueble {
  return {
    id: row.id as string,
    code: row.code as string,
    titulo: row.titulo as string,
    direccion: row.direccion as string,
    ciudad: row.ciudad as string,
    tipo: row.tipo as string,
    estado: row.estado as Inmueble["estado"],
    canonMensual: Number(row.canon_mensual),
    arrendadorId: row.arrendador_id as string,
    descripcion: row.descripcion as string | undefined,
    creadoEn: row.creado_en as string,
  };
}

function toRow(input: Partial<Inmueble>): Record<string, unknown> {
  return {
    titulo: input.titulo,
    direccion: input.direccion,
    ciudad: input.ciudad,
    tipo: input.tipo,
    estado: input.estado,
    canon_mensual: input.canonMensual,
    arrendador_id: input.arrendadorId,
    descripcion: input.descripcion,
    creado_en: input.creadoEn,
  };
}
