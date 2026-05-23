import { seedServicios } from "@/data/mock/seed";
import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { buildMockEntity } from "@/lib/mock-create";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore } from "@/repositories/mock-store";
import type { CreateInput, ServicioPublico, UpdateInput } from "@/types";

export interface ServiciosRepository {
  findAll(): Promise<ServicioPublico[]>;
  findById(id: string): Promise<ServicioPublico | null>;
  create(data: CreateInput<ServicioPublico>): Promise<ServicioPublico>;
  update(id: string, data: UpdateInput<ServicioPublico>): Promise<ServicioPublico | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedServicios);

export const serviciosMockRepository: ServiciosRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => {
    const item = buildMockEntity<ServicioPublico>(
      ENTITY_CODE_PREFIX.servicio,
      data,
      mockStore.getAll()
    );
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const serviciosSupabaseRepository: ServiciosRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("servicios_publicos").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("servicios_publicos").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data: existing } = await sb.from("servicios_publicos").select("code");
    const code = generateUniqueCode(
      ENTITY_CODE_PREFIX.servicio,
      (existing ?? []).map((r) => r.code as string)
    );
    const { data, error } = await sb
      .from("servicios_publicos")
      .insert({ ...toRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("servicios_publicos").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
  delete: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return false;
    const { error } = await sb.from("servicios_publicos").delete().eq("id", id);
    return !error;
  },
};

function mapRow(r: Record<string, unknown>): ServicioPublico {
  return {
    id: r.id as string,
    code: r.code as string,
    inmuebleId: r.inmueble_id as string,
    tipo: r.tipo as string,
    empresaPrestadora: (r.empresa_prestadora as string) ?? "",
    numeroCuentaServicio: (r.numero_cuenta_servicio as string) ?? "",
    periodo: r.periodo as string,
    monto: Number(r.monto),
    vencimiento: r.vencimiento as string,
    estado: r.estado as ServicioPublico["estado"],
    comprobanteUrl: r.comprobante_url as string | undefined,
  };
}

function toRow(i: Partial<ServicioPublico>) {
  return {
    inmueble_id: i.inmuebleId,
    tipo: i.tipo,
    empresa_prestadora: i.empresaPrestadora,
    numero_cuenta_servicio: i.numeroCuentaServicio,
    periodo: i.periodo,
    monto: i.monto,
    vencimiento: i.vencimiento,
    estado: i.estado,
    comprobante_url: i.comprobanteUrl,
  };
}
