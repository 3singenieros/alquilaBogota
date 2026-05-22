import { seedPagos } from "@/data/mock/seed";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createMockStore, newId } from "@/repositories/mock-store";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";

export interface PagosRepository {
  findAll(): Promise<PagoReportado[]>;
  findById(id: string): Promise<PagoReportado | null>;
  create(data: CreateInput<PagoReportado>): Promise<PagoReportado>;
  update(id: string, data: UpdateInput<PagoReportado>): Promise<PagoReportado | null>;
  delete(id: string): Promise<boolean>;
}

const mockStore = createMockStore(seedPagos);

export const pagosMockRepository: PagosRepository = {
  findAll: async () => mockStore.getAll(),
  findById: async (id) => mockStore.getById(id),
  create: async (data) => mockStore.create({ ...data, id: newId("pag") }),
  update: async (id, data) => mockStore.update(id, data),
  delete: async (id) => mockStore.remove(id),
};

export const pagosSupabaseRepository: PagosRepository = {
  findAll: async () => {
    const sb = getSupabaseClient();
    if (!sb) return [];
    const { data, error } = await sb.from("pagos_reportados").select("*");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  },
  findById: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("pagos_reportados").select("*").eq("id", id).single();
    return data ? mapRow(data) : null;
  },
  create: async (input) => {
    const sb = getSupabaseClient();
    if (!sb) throw new Error("Supabase no configurado");
    const { data, error } = await sb.from("pagos_reportados").insert(toRow(input)).select().single();
    if (error) throw error;
    return mapRow(data);
  },
  update: async (id, input) => {
    const sb = getSupabaseClient();
    if (!sb) return null;
    const { data } = await sb.from("pagos_reportados").update(toRow(input)).eq("id", id).select().single();
    return data ? mapRow(data) : null;
  },
  delete: async (id) => {
    const sb = getSupabaseClient();
    if (!sb) return false;
    const { error } = await sb.from("pagos_reportados").delete().eq("id", id);
    return !error;
  },
};

function mapRow(r: Record<string, unknown>): PagoReportado {
  return {
    id: r.id as string,
    contratoId: r.contrato_id as string,
    mes: r.mes as string,
    monto: Number(r.monto),
    fechaReporte: r.fecha_reporte as string,
    estado: r.estado as PagoReportado["estado"],
    comprobanteUrl: r.comprobante_url as string | undefined,
    notas: r.notas as string | undefined,
    reportadoPorId: r.reportado_por_id as string,
  };
}

function toRow(i: Partial<PagoReportado>) {
  return {
    contrato_id: i.contratoId,
    mes: i.mes,
    monto: i.monto,
    fecha_reporte: i.fechaReporte,
    estado: i.estado,
    comprobante_url: i.comprobanteUrl,
    notas: i.notas,
    reportado_por_id: i.reportadoPorId,
  };
}
