import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { requireSupabase, extractEntityCodes } from "@/lib/supabase/helpers";
import type { PagosRepository } from "@/repositories/pagos.repository";
import type {
  CreateSoportePagoInput,
  SoportePagoRepository,
} from "@/repositories/soporte-pago.repository";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";
import type { SoportePago } from "@/types/soporte-pago";

const TABLE_PAGOS = "pagos_canon" as const;

function mapPagoRow(r: Record<string, unknown>): PagoReportado {
  return {
    id: r.id as string,
    code: r.code as string,
    contratoId: r.contrato_id as string,
    mes: r.mes as string,
    monto: Number(r.monto),
    fechaReporte: r.fecha_reporte as string,
    estado: r.estado as PagoReportado["estado"],
    comprobanteUrl: r.comprobante_url as string | undefined,
    notas: r.notas as string | undefined,
    medioPago: r.medio_pago as string | undefined,
    reportadoPorId: r.reportado_por_id as string,
    fechaValidacion: r.fecha_validacion as string | undefined,
    validadoPorId: r.validado_por_id as string | undefined,
    rechazadoPorId: r.rechazado_por_id as string | undefined,
    motivoRechazo: r.motivo_rechazo as string | undefined,
    soportePagoId: r.soporte_pago_id as string | undefined,
  };
}

function toPagoRow(i: Partial<PagoReportado>) {
  return {
    contrato_id: i.contratoId,
    mes: i.mes,
    monto: i.monto,
    fecha_reporte: i.fechaReporte,
    estado: i.estado,
    comprobante_url: i.comprobanteUrl,
    notas: i.notas,
    medio_pago: i.medioPago,
    reportado_por_id: i.reportadoPorId,
    fecha_validacion: i.fechaValidacion,
    validado_por_id: i.validadoPorId,
    rechazado_por_id: i.rechazadoPorId,
    motivo_rechazo: i.motivoRechazo,
    soporte_pago_id: i.soportePagoId,
  };
}

function mapSoporteRow(r: Record<string, unknown>): SoportePago {
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

function toSoporteRow(s: Partial<SoportePago>) {
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

export const supabasePaymentRepository: PagosRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from(TABLE_PAGOS).select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapPagoRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from(TABLE_PAGOS).select("*").eq("id", id).maybeSingle();
    return data ? mapPagoRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from(TABLE_PAGOS).select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.pago, extractEntityCodes(existing));
    const { data, error } = await sb
      .from(TABLE_PAGOS)
      .insert({ ...toPagoRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapPagoRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from(TABLE_PAGOS)
      .update(toPagoRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapPagoRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from(TABLE_PAGOS).delete().eq("id", id);
    return !error;
  },
};

export const supabaseSoportePagoRepository: SoportePagoRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("soportes_pago").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapSoporteRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("soportes_pago").select("*").eq("id", id).maybeSingle();
    return data ? mapSoporteRow(data as Record<string, unknown>) : null;
  },
  findByPagoId: async (pagoId) => {
    const sb = requireSupabase();
    const { data } = await sb.from("soportes_pago").select("*").eq("pago_id", pagoId).maybeSingle();
    return data ? mapSoporteRow(data as Record<string, unknown>) : null;
  },
  create: async (input: CreateSoportePagoInput) => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("soportes_pago").insert(toSoporteRow(input)).select().single();
    if (error) throw error;
    return mapSoporteRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("soportes_pago")
      .update(toSoporteRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapSoporteRow(data as Record<string, unknown>) : null;
  },
};

export const pagosSupabaseRepository = supabasePaymentRepository;
export const soportePagoSupabaseRepository = supabaseSoportePagoRepository;
