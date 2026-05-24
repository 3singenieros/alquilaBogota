/**
 * Repositorios Supabase — servicios públicos, pagos de servicio y notificaciones.
 * Fase 2 de migración: stubs tipados listos para implementación CRUD completa.
 */
import { requireSupabase } from "@/lib/supabase/helpers";
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

const NOT_READY = "Supabase: módulo servicios/notificaciones — migración fase 2 pendiente";

export const supabaseServicesRepository: ServiciosContratoRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("servicios_publicos_contrato").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as ServicioPublicoContrato[];
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb
      .from("servicios_publicos_contrato")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as unknown as ServicioPublicoContrato) ?? null;
  },
  findByContratoId: async (contratoId) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("servicios_publicos_contrato")
      .select("*")
      .eq("contrato_id", contratoId);
    if (error) throw error;
    return (data ?? []) as unknown as ServicioPublicoContrato[];
  },
  create: async (_input: CreateInput<ServicioPublicoContrato>) => {
    throw new Error(NOT_READY);
  },
  update: async (_id: string, _input: UpdateInput<ServicioPublicoContrato>) => null,
  delete: async () => false,
};

export const supabasePagosServicioRepository: PagosServicioRepository = {
  findAll: async () => {
    const sb = requireSupabase();
    const { data, error } = await sb.from("pagos_servicios_publicos").select("*");
    if (error) throw error;
    return (data ?? []) as unknown as PagoServicioPublico[];
  },
  findById: async (id) => {
    const sb = requireSupabase();
    const { data } = await sb.from("pagos_servicios_publicos").select("*").eq("id", id).maybeSingle();
    return (data as unknown as PagoServicioPublico) ?? null;
  },
  findByServicioContratoId: async (servicioId) => {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("pagos_servicios_publicos")
      .select("*")
      .eq("servicio_publico_contrato_id", servicioId);
    if (error) {
      const { data: alt } = await sb
        .from("pagos_servicios_publicos")
        .select("*")
        .eq("servicio_publico_contrato_id", servicioId);
      return (alt ?? []) as unknown as PagoServicioPublico[];
    }
    return (data ?? []) as unknown as PagoServicioPublico[];
  },
  create: async () => {
    throw new Error(NOT_READY);
  },
  update: async () => null,
  delete: async () => false,
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
