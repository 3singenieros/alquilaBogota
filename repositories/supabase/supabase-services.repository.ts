/**
 * Repositorios Supabase — servicios públicos, pagos de servicio y notificaciones.
 */
import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { extractEntityCodes, nullableFkId, requireSupabase } from "@/lib/supabase/helpers";
import type { ServiciosContratoRepository } from "@/repositories/servicios-contrato.repository";
import type { PagosServicioRepository } from "@/repositories/pagos-servicio.repository";
import type { NotificacionesRepository } from "@/repositories/notificaciones.repository";
import type {
  CreateInput,
  Notificacion,
  PagoServicioPublico,
  ServicioPublicoContrato,
  UpdateInput,
} from "@/types";
import {
  fetchAdjuntosPorEntidades,
  pagoServicioConComprobantes,
} from "@/repositories/supabase/supabase-adjuntos-entidad";

function mapServicioRow(r: Record<string, unknown>): ServicioPublicoContrato {
  return {
    id: r.id as string,
    code: r.code as string,
    contratoId: r.contrato_id as string,
    inmuebleId: r.inmueble_id as string,
    tipoServicio: r.tipo_servicio as ServicioPublicoContrato["tipoServicio"],
    empresaPrestadora: r.empresa_prestadora as string,
    numeroCuentaServicio: r.numero_cuenta_servicio as string,
    periodicidad: r.periodicidad as ServicioPublicoContrato["periodicidad"],
    activo: Boolean(r.activo),
    observaciones: r.observaciones as string | undefined,
  };
}

function toServicioRow(i: Partial<ServicioPublicoContrato>) {
  return {
    contrato_id: i.contratoId,
    inmueble_id: i.inmuebleId,
    tipo_servicio: i.tipoServicio,
    empresa_prestadora: i.empresaPrestadora,
    numero_cuenta_servicio: i.numeroCuentaServicio,
    periodicidad: i.periodicidad,
    activo: i.activo,
    observaciones: i.observaciones,
  };
}

function mapPagoServicioRow(r: Record<string, unknown>): PagoServicioPublico {
  return {
    id: r.id as string,
    code: r.code as string,
    servicioPublicoContratoId: r.servicio_publico_contrato_id as string,
    contratoId: r.contrato_id as string,
    inmuebleId: r.inmueble_id as string,
    periodo: r.periodo as string,
    fechaPago: r.fecha_pago as string,
    fechaReporte: r.fecha_reporte as string,
    fechaVencimiento: r.fecha_vencimiento as string,
    valorPagado: Number(r.valor_pagado),
    estado: r.estado as PagoServicioPublico["estado"],
    comprobanteUrl: r.comprobante_url as string | undefined,
    reportadoPorId: r.reportado_por_id as string,
    validadoPorId: (r.validado_por_id as string) || undefined,
    fechaValidacion: r.fecha_validacion as string | undefined,
    motivoRechazo: r.motivo_rechazo as string | undefined,
    observaciones: r.observaciones as string | undefined,
  };
}

function toPagoServicioRow(i: Partial<PagoServicioPublico>) {
  return {
    servicio_publico_contrato_id: i.servicioPublicoContratoId,
    contrato_id: i.contratoId,
    inmueble_id: i.inmuebleId,
    periodo: i.periodo,
    fecha_pago: i.fechaPago,
    fecha_reporte: i.fechaReporte,
    fecha_vencimiento: i.fechaVencimiento,
    valor_pagado: i.valorPagado,
    estado: i.estado,
    comprobante_url: i.comprobanteUrl,
    reportado_por_id: i.reportadoPorId,
    validado_por_id: nullableFkId(i.validadoPorId),
    fecha_validacion: i.fechaValidacion,
    motivo_rechazo: i.motivoRechazo,
    observaciones: i.observaciones,
  };
}

export const supabaseServicesRepository: ServiciosContratoRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("servicios_publicos_contrato").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapServicioRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("servicios_publicos_contrato")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? mapServicioRow(data as Record<string, unknown>) : null;
  },
  findByContratoId: async (contratoId) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("servicios_publicos_contrato")
      .select("*")
      .eq("contrato_id", contratoId);
    if (error) throw error;
    return (data ?? []).map((r) => mapServicioRow(r as Record<string, unknown>));
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from("servicios_publicos_contrato").select("code");
    const code = generateUniqueCode(
      ENTITY_CODE_PREFIX.servicioContrato,
      extractEntityCodes(existing)
    );
    const { data, error } = await sb
      .from("servicios_publicos_contrato")
      .insert({ ...toServicioRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapServicioRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("servicios_publicos_contrato")
      .update(toServicioRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? mapServicioRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from("servicios_publicos_contrato").delete().eq("id", id);
    return !error;
  },
};

export const supabasePagosServicioRepository: PagosServicioRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("pagos_servicios_publicos").select("*");
    if (error) throw error;
    const rows = (data ?? []).map((r) => mapPagoServicioRow(r as Record<string, unknown>));
    const adjMap = await fetchAdjuntosPorEntidades(
      "PAGO_SERVICIO_PUBLICO",
      rows.map((p) => p.id)
    );
    return rows.map((p) => ({ ...p, ...pagoServicioConComprobantes(p, adjMap) }));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("pagos_servicios_publicos").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const pago = mapPagoServicioRow(data as Record<string, unknown>);
    const adjMap = await fetchAdjuntosPorEntidades("PAGO_SERVICIO_PUBLICO", [id]);
    return { ...pago, ...pagoServicioConComprobantes(pago, adjMap) };
  },
  findByServicioContratoId: async (servicioId) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("pagos_servicios_publicos")
      .select("*")
      .eq("servicio_publico_contrato_id", servicioId);
    if (error) throw error;
    const rows = (data ?? []).map((r) => mapPagoServicioRow(r as Record<string, unknown>));
    const adjMap = await fetchAdjuntosPorEntidades(
      "PAGO_SERVICIO_PUBLICO",
      rows.map((p) => p.id)
    );
    return rows.map((p) => ({ ...p, ...pagoServicioConComprobantes(p, adjMap) }));
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from("pagos_servicios_publicos").select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.pagoServicio, extractEntityCodes(existing));
    const { data, error } = await sb
      .from("pagos_servicios_publicos")
      .insert({ ...toPagoServicioRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapPagoServicioRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("pagos_servicios_publicos")
      .update(toPagoServicioRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const pago = mapPagoServicioRow(data as Record<string, unknown>);
    const adjMap = await fetchAdjuntosPorEntidades("PAGO_SERVICIO_PUBLICO", [id]);
    return { ...pago, ...pagoServicioConComprobantes(pago, adjMap) };
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb.from("pagos_servicios_publicos").delete().eq("id", id);
    return !error;
  },
};

function mapNotificacionRow(r: Record<string, unknown>): Notificacion {
  return {
    id: r.id as string,
    tipo: r.tipo as Notificacion["tipo"],
    contratoId: r.contrato_id as string | undefined,
    destinatarioNombre: r.destinatario_nombre as string,
    destinatarioEmail: r.destinatario_email as string,
    rolDestinatario: r.rol_destinatario as Notificacion["rolDestinatario"],
    asunto: r.asunto as string,
    mensaje: r.mensaje as string,
    estado: r.estado as Notificacion["estado"],
    fechaCreacion: r.fecha_creacion as string,
    fechaEnvioSimulado: r.fecha_envio_simulado as string | undefined,
    referenciaModulo: r.referencia_modulo as string,
  };
}

export const supabaseNotificacionesRepository: NotificacionesRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("notificaciones").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapNotificacionRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("notificaciones").select("*").eq("id", id).maybeSingle();
    return data ? mapNotificacionRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const row = {
      tipo: input.tipo,
      contrato_id: input.contratoId,
      destinatario_nombre: input.destinatarioNombre,
      destinatario_email: input.destinatarioEmail,
      rol_destinatario: input.rolDestinatario,
      asunto: input.asunto,
      mensaje: input.mensaje,
      estado: input.estado,
      fecha_creacion: input.fechaCreacion ?? new Date().toISOString(),
      fecha_envio_simulado: input.fechaEnvioSimulado,
      referencia_modulo: input.referenciaModulo,
    };
    const { data, error } = await sb.from("notificaciones").insert(row).select().single();
    if (error) throw error;
    return mapNotificacionRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const row = {
      estado: input.estado,
      fecha_envio_simulado: input.fechaEnvioSimulado,
    };
    const { data } = await sb.from("notificaciones").update(row).eq("id", id).select().maybeSingle();
    return data ? mapNotificacionRow(data as Record<string, unknown>) : null;
  },
};

export const serviciosContratoSupabaseRepository = supabaseServicesRepository;
export const pagosServicioSupabaseRepository = supabasePagosServicioRepository;
export const notificacionesSupabaseRepository = supabaseNotificacionesRepository;
