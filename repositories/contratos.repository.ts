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
    arrendatarioId: (r.arrendatario_id as string) ?? "",
    emailArrendatario: (r.email_arrendatario as string) ?? "",
    nombreArrendatario: r.nombre_arrendatario as string | undefined,
    arrendadorId: r.arrendador_id as string,
    fechaInicio: r.fecha_inicio as string,
    fechaFin: r.fecha_fin as string,
    canonActual: Number(r.canon_actual ?? r.canon_mensual),
    canonAnterior: Number(r.canon_anterior ?? 0),
    porcentajeReajuste: Number(r.porcentaje_reajuste ?? 0),
    fechaUltimoReajuste: r.fecha_ultimo_reajuste as string | undefined,
    estado: r.estado as Contrato["estado"],
    documentoUrl: r.documento_url as string | undefined,
    codeudorNombre: r.codeudor_nombre as string | undefined,
    codeudorDocumento: r.codeudor_documento as string | undefined,
    codeudorTelefono: r.codeudor_telefono as string | undefined,
    codeudorEmail: r.codeudor_email as string | undefined,
    depositoGarantiaValor: Number(r.deposito_garantia_valor ?? 0),
    depositoGarantiaEstado: (r.deposito_garantia_estado as Contrato["depositoGarantiaEstado"]) ?? "PENDIENTE",
    prorrogaAutomatica: Boolean(r.prorroga_automatica),
    fechaLimitePreaviso: r.fecha_limite_preaviso as string,
    inventarioEntrega: (r.inventario_entrega as string) ?? "",
    observacionesEntrega: r.observaciones_entrega as string | undefined,
    motivoRechazo: r.motivo_rechazo as string | undefined,
    creadoEn: r.creado_en as string,
  };
}

function toRow(i: Partial<Contrato>) {
  return {
    inmueble_id: i.inmuebleId,
    arrendatario_id: i.arrendatarioId,
    email_arrendatario: i.emailArrendatario,
    nombre_arrendatario: i.nombreArrendatario,
    arrendador_id: i.arrendadorId,
    fecha_inicio: i.fechaInicio,
    fecha_fin: i.fechaFin,
    canon_actual: i.canonActual,
    canon_anterior: i.canonAnterior,
    porcentaje_reajuste: i.porcentajeReajuste,
    fecha_ultimo_reajuste: i.fechaUltimoReajuste,
    estado: i.estado,
    documento_url: i.documentoUrl,
    codeudor_nombre: i.codeudorNombre,
    codeudor_documento: i.codeudorDocumento,
    codeudor_telefono: i.codeudorTelefono,
    codeudor_email: i.codeudorEmail,
    deposito_garantia_valor: i.depositoGarantiaValor,
    deposito_garantia_estado: i.depositoGarantiaEstado,
    prorroga_automatica: i.prorrogaAutomatica,
    fecha_limite_preaviso: i.fechaLimitePreaviso,
    inventario_entrega: i.inventarioEntrega,
    observaciones_entrega: i.observacionesEntrega,
    motivo_rechazo: i.motivoRechazo,
    creado_en: i.creadoEn,
  };
}
