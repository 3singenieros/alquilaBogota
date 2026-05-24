import { ENTITY_CODE_PREFIX, generateUniqueCode } from "@/lib/entity-codes";
import { requireSupabase, extractEntityCodes } from "@/lib/supabase/helpers";
import type { ContratosRepository } from "@/repositories/contratos.repository";
import type { InvitacionesContratoRepository } from "@/repositories/invitaciones-contrato.repository";
import type { Contrato, CreateInput, InvitacionContrato, UpdateInput } from "@/types";

function mapContratoRow(r: Record<string, unknown>): Contrato {
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
    depositoGarantiaEstado:
      (r.deposito_garantia_estado as Contrato["depositoGarantiaEstado"]) ?? "PENDIENTE",
    prorrogaAutomatica: Boolean(r.prorroga_automatica),
    fechaLimitePreaviso: r.fecha_limite_preaviso as string,
    inventarioEntrega: (r.inventario_entrega as string) ?? "",
    observacionesEntrega: r.observaciones_entrega as string | undefined,
    motivoRechazo: r.motivo_rechazo as string | undefined,
    creadoEn: r.creado_en as string,
    noRenovar: Boolean(r.no_renovar),
    fechaNoRenovacionRegistrada: r.fecha_no_renovacion_registrada as string | undefined,
    origenNoRenovacion: r.origen_no_renovacion as Contrato["origenNoRenovacion"],
    noRenovacionId: r.no_renovacion_id as string | undefined,
  };
}

function toContratoRow(i: Partial<Contrato>) {
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
    no_renovar: i.noRenovar,
    fecha_no_renovacion_registrada: i.fechaNoRenovacionRegistrada,
    origen_no_renovacion: i.origenNoRenovacion,
    no_renovacion_id: i.noRenovacionId,
  };
}

function mapInvitacionRow(r: Record<string, unknown>): InvitacionContrato {
  return {
    id: r.id as string,
    contratoId: r.contrato_id as string,
    emailInvitado: r.email_invitado as string,
    nombreInvitado: r.nombre_invitado as string | undefined,
    estado: r.estado as InvitacionContrato["estado"],
    tokenInvitacion: r.token_invitacion as string,
    fechaCreacion: r.fecha_creacion as string,
    fechaRespuesta: r.fecha_respuesta as string | undefined,
    motivoRechazo: r.motivo_rechazo as string | undefined,
  };
}

function toInvitacionRow(i: Partial<InvitacionContrato>) {
  return {
    contrato_id: i.contratoId,
    email_invitado: i.emailInvitado,
    nombre_invitado: i.nombreInvitado,
    estado: i.estado,
    token_invitacion: i.tokenInvitacion,
    fecha_creacion: i.fechaCreacion,
    fecha_respuesta: i.fechaRespuesta,
    motivo_rechazo: i.motivoRechazo,
  };
}

export const supabaseContractRepository: ContratosRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("contratos").select("*").is("deleted_at", null);
    if (error) throw error;
    return (data ?? []).map((r) => mapContratoRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("contratos").select("*").eq("id", id).maybeSingle();
    return data ? mapContratoRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data: existing } = await sb.from("contratos").select("code");
    const code = generateUniqueCode(ENTITY_CODE_PREFIX.contrato, extractEntityCodes(existing));
    const { data, error } = await sb
      .from("contratos")
      .insert({ ...toContratoRow(input), code })
      .select()
      .single();
    if (error) throw error;
    return mapContratoRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("contratos")
      .update(toContratoRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapContratoRow(data as Record<string, unknown>) : null;
  },
  delete: async (id) => {
    const sb = requireSupabase();
    const { error } = await sb
      .from("contratos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    return !error;
  },
};

export const supabaseInvitacionesContratoRepository: InvitacionesContratoRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("invitaciones_contrato").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => mapInvitacionRow(r as Record<string, unknown>));
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("invitaciones_contrato").select("*").eq("id", id).maybeSingle();
    return data ? mapInvitacionRow(data as Record<string, unknown>) : null;
  },
  findByContratoId: async (contratoId) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("invitaciones_contrato")
      .select("*")
      .eq("contrato_id", contratoId)
      .maybeSingle();
    return data ? mapInvitacionRow(data as Record<string, unknown>) : null;
  },
  create: async (input) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("invitaciones_contrato")
      .insert(toInvitacionRow(input))
      .select()
      .single();
    if (error) throw error;
    return mapInvitacionRow(data as Record<string, unknown>);
  },
  update: async (id, input) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("invitaciones_contrato")
      .update(toInvitacionRow(input))
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? mapInvitacionRow(data as Record<string, unknown>) : null;
  },
};

export const contratosSupabaseRepository = supabaseContractRepository;
export const invitacionesContratoSupabaseRepository = supabaseInvitacionesContratoRepository;
