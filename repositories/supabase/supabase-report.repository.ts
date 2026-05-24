/**
 * Queries agregadas para reportes — preparación fase Supabase.
 * Los servicios de reportes consumirán estas funciones cuando APP_MODE=SUPABASE.
 */
import { requireSupabase } from "@/lib/supabase/helpers";

export type ReporteFiltros = {
  contratoId?: string;
  inmuebleId?: string;
  usuarioId?: string;
  desde?: string;
  hasta?: string;
};

export const supabaseReportQueries = {
  /** Historial de contrato: contrato + pagos + trazabilidad */
  async historialContrato(contratoId: string) {
    const sb = requireSupabase();
    const [contrato, pagos, eventos] = await Promise.all([
      sb.from("contratos").select("*, inmuebles(*)").eq("id", contratoId).maybeSingle(),
      sb.from("pagos_canon").select("*").eq("contrato_id", contratoId).order("fecha_reporte"),
      sb
        .from("evento_trazabilidad")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("fecha_hora", { ascending: false }),
    ]);
    return { contrato: contrato.data, pagos: pagos.data ?? [], eventos: eventos.data ?? [] };
  },

  /** Historial de inmueble: inmueble + contratos + mantenimientos + trazabilidad */
  async historialInmueble(inmuebleId: string) {
    const sb = requireSupabase();
    const [inmueble, contratos, mantenimientos, eventos] = await Promise.all([
      sb.from("inmuebles").select("*").eq("id", inmuebleId).maybeSingle(),
      sb.from("contratos").select("*").eq("inmueble_id", inmuebleId),
      sb.from("mantenimientos").select("*").eq("inmueble_id", inmuebleId),
      sb
        .from("evento_trazabilidad")
        .select("*")
        .eq("inmueble_id", inmuebleId)
        .order("fecha_hora", { ascending: false }),
    ]);
    return {
      inmueble: inmueble.data,
      contratos: contratos.data ?? [],
      mantenimientos: mantenimientos.data ?? [],
      eventos: eventos.data ?? [],
    };
  },

  /** Trazabilidad filtrada con joins de contexto */
  async trazabilidadFiltrada(filtros: ReporteFiltros) {
    const sb = requireSupabase();
    let query = sb.from("evento_trazabilidad").select("*").order("fecha_hora", { ascending: false });
    if (filtros.contratoId) query = query.eq("contrato_id", filtros.contratoId);
    if (filtros.inmuebleId) query = query.eq("inmueble_id", filtros.inmuebleId);
    if (filtros.usuarioId) query = query.eq("usuario_id", filtros.usuarioId);
    if (filtros.desde) query = query.gte("fecha_hora", filtros.desde);
    if (filtros.hasta) query = query.lte("fecha_hora", filtros.hasta);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  /** Resumen de pagos por contrato */
  async resumenPagosContrato(contratoId: string) {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from("pagos_canon")
      .select("estado, monto")
      .eq("contrato_id", contratoId);
    if (error) throw error;
    const rows = data ?? [];
    return {
      total: rows.length,
      reportados: rows.filter((r) => r.estado === "REPORTADO").length,
      validados: rows.filter((r) => r.estado === "VALIDADO").length,
      rechazados: rows.filter((r) => r.estado === "RECHAZADO").length,
      montoValidado: rows
        .filter((r) => r.estado === "VALIDADO")
        .reduce((s, r) => s + Number(r.monto), 0),
    };
  },

  /** Mantenimientos abiertos por inmueble */
  async mantenimientosAbiertos(inmuebleId?: string) {
    const sb = requireSupabase();
    let query = sb
      .from("mantenimientos")
      .select("*")
      .in("estado", ["ABIERTO", "EN_GESTION"]);
    if (inmuebleId) query = query.eq("inmueble_id", inmuebleId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  /** Expedientes de no renovación con contrato */
  async noRenovacionesConContrato(contratoId?: string) {
    const sb = requireSupabase();
    let query = sb.from("no_renovaciones").select("*, contratos(code, estado, fecha_fin)");
    if (contratoId) query = query.eq("contrato_id", contratoId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
};

export type SupabaseReportQueries = typeof supabaseReportQueries;
