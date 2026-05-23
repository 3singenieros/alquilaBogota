import { seedSoportesPago } from "@/data/mock/seed-soportes-pago";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { SoportePago } from "@/types/soporte-pago";

export type CreateSoportePagoInput = Omit<SoportePago, "id" | "numeroSoporte"> &
  Partial<Pick<SoportePago, "id" | "numeroSoporte">>;

export interface SoportePagoRepository {
  findAll(): Promise<SoportePago[]>;
  findById(id: string): Promise<SoportePago | null>;
  findByPagoId(pagoId: string): Promise<SoportePago | null>;
  create(data: CreateSoportePagoInput): Promise<SoportePago>;
  update(id: string, data: Partial<SoportePago>): Promise<SoportePago | null>;
}

function nextNumeroSoporte(existing: SoportePago[]): string {
  const year = new Date().getFullYear();
  const prefix = `SP-${year}-`;
  const nums = existing
    .filter((s) => s.numeroSoporte.startsWith(prefix))
    .map((s) => parseInt(s.numeroSoporte.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

const mockStore = createMockStore(seedSoportesPago);

export const soportePagoMockRepository: SoportePagoRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  findByPagoId: async (pagoId) =>
    mockStore.getAll().find((s) => s.pagoId === pagoId) ?? null,
  create: async (data) => {
    const all = mockStore.getAll();
    const item: SoportePago = {
      id: data.id ?? newId("sp"),
      pagoId: data.pagoId,
      contratoId: data.contratoId,
      arrendadorId: data.arrendadorId,
      arrendatarioId: data.arrendatarioId,
      numeroSoporte: data.numeroSoporte ?? nextNumeroSoporte(all),
      fechaGeneracion: data.fechaGeneracion,
      monto: data.monto,
      periodo: data.periodo,
      medioPago: data.medioPago,
      observaciones: data.observaciones,
      estadoEnvioEmail: data.estadoEnvioEmail,
    };
    return mockStore.create(item);
  },
  update: async (id, data) => mockStore.update(id, data),
};

export const soportePagoSupabaseRepository: SoportePagoRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("soportes_pago").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("soportes_pago").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  findByPagoId: async (pagoId) => {
    const items = await soportePagoSupabaseRepository.findAll();
    return items.find((s) => s.pagoId === pagoId) ?? null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("soportes_pago").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb
      .from("soportes_pago")
      .update(toRow(input))
      .eq("id", id)
      .select()
      .single();
    return data ? mapRow(data) : null;
  },
};

function mapRow(r: Record<string, unknown>): SoportePago {
  return {
    id: r.id as string,
    pagoId: r.pago_id as string,
    contratoId: r.contrato_id as string,
    arrendadorId: r.arrendador_id as string,
    arrendatarioId: r.arrendatario_id as string,
    numeroSoporte: r.numero_soporte as string,
    fechaGeneracion: r.fecha_generacion as string,
    monto: Number(r.monto),
    periodo: r.periodo as string,
    medioPago: r.medio_pago as string | undefined,
    observaciones: r.observaciones as string | undefined,
    estadoEnvioEmail: r.estado_envio_email as SoportePago["estadoEnvioEmail"],
  };
}

function toRow(s: Partial<SoportePago>) {
  return {
    pago_id: s.pagoId,
    contrato_id: s.contratoId,
    arrendador_id: s.arrendadorId,
    arrendatario_id: s.arrendatarioId,
    numero_soporte: s.numeroSoporte,
    fecha_generacion: s.fechaGeneracion,
    monto: s.monto,
    periodo: s.periodo,
    medio_pago: s.medioPago,
    observaciones: s.observaciones,
    estado_envio_email: s.estadoEnvioEmail,
  };
}
