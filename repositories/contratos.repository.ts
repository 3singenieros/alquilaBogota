import { seedContratos } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
import type { Contrato, CreateInput, UpdateInput } from "@/types";

export interface ContratosRepository {
  findAll(): Promise<Contrato[]>;
  findById(id: string): Promise<Contrato | null>;
  create(data: CreateInput<Contrato>): Promise<Contrato>;
  update(id: string, data: UpdateInput<Contrato>): Promise<Contrato | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedContratos);

export const contratosMockRepository: ContratosRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<Contrato>(
      ENTITY_CODE_PREFIX.contrato,
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

export const contratosSupabaseRepository: ContratosRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("contratos").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("contratos").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data: existing } = await sb.from("contratos").select("code");
    const code = generateUniqueCode(
      ENTITY_CODE_PREFIX.contrato,
      (existing ?? []).map((r) => r.code as string)
    );
    const { data, error } = await sb
      .from("contratos")
      .insert({ ...toRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("contratos").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
  delete: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return false;
    const { error } = await sb.from("contratos").delete().eq("id", id);
    return !error;
  },
};

function mapRow(r: Record<string, unknown>): Contrato {
  return {
    id: r.id as string,
    code: r.code as string,
    inmuebleId: r.inmueble_id as string,
    arrendatarioId: r.arrendatario_id as string,
    arrendadorId: r.arrendador_id as string,
    fechaInicio: r.fecha_inicio as string,
    fechaFin: r.fecha_fin as string,
    canonMensual: Number(r.canon_mensual),
    estado: r.estado as Contrato["estado"],
    documentoUrl: r.documento_url as string | undefined,
    creadoEn: r.creado_en as string,
  };
}

function toRow(i: Partial<Contrato>) {
  return {
    inmueble_id: i.inmuebleId,
    arrendatario_id: i.arrendatarioId,
    arrendador_id: i.arrendadorId,
    fecha_inicio: i.fechaInicio,
    fecha_fin: i.fechaFin,
    canon_mensual: i.canonMensual,
    estado: i.estado,
    documento_url: i.documentoUrl,
    creado_en: i.creadoEn,
  };
}
