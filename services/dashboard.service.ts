import { seedIncidencias } from "@/data/mock/seed";
import { listarEventosRecientes } from "@/services/trazabilidad.service";
import { contratoProximoAVencer, preavisoVencido } from "@/lib/contrato-alertas";
import { loadAuthContext } from "@/lib/auth/load-context";
import { rolEfectivo } from "@/lib/auth/rol";
import { fechaHoy } from "@/lib/servicios-estado";
import {
  contratoIdsForUser,
  filterContratos,
  filterInmuebles,
  filterMantenimiento,
  filterPagos,
  filterPagosServicio,
} from "@/lib/auth/scopes";
import { loadAccessContext } from "@/services/access-control.service";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  getInvitacionesContratoRepository,
  getComentariosMantenimientoRepository,
  getMantenimientoRepository,
  getNotificacionesRepository,
  getPagosRepository,
  getPagosServicioRepository,
  getSoportePagoRepository,
} from "@/repositories";
import { filtroNotificacionesPorRol } from "@/services/notificaciones.service";
import type { Contrato, PagoServicioPublico, Rol } from "@/types";

const ACTIVIDAD_POR_ROL: Record<Rol, string[]> = {
  ADMIN: ["Pagos", "Mantenimiento", "Contratos", "Servicios públicos", "No renovación", "Notificaciones"],
  ARRENDADOR: ["Pagos", "Mantenimiento", "Contratos", "Notificaciones"],
  ARRENDATARIO: ["Pagos", "Mantenimiento", "Servicios públicos", "No renovación", "Notificaciones"],
};

function pagosProximosAVencer(pagos: PagoServicioPublico[], dias = 7): PagoServicioPublico[] {
  const hoy = fechaHoy();
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + dias);
  const tope = limite.toISOString().slice(0, 10);
  return pagos.filter(
    (p) =>
      (p.estado === "REPORTADO" || p.estado === "PENDIENTE") &&
      p.fechaVencimiento >= hoy &&
      p.fechaVencimiento <= tope
  );
}

export async function getDashboardResumen() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "dashboard");

  const { contratos, inmuebles } = await loadAuthContext();
  const inmueblesScope = filterInmuebles(inmuebles, usuario);
  const contratosScope = filterContratos(contratos, usuario);
  const [pagosAll, mantenimientoAll, pagosServicioAll, notificacionesAll, soportesAll, comentariosAll] =
    await Promise.all([
      getPagosRepository().findAll(),
      getMantenimientoRepository().findAll(),
      getPagosServicioRepository().findAll(),
      getNotificacionesRepository().findAll(),
      getSoportePagoRepository().findAll(),
      getComentariosMantenimientoRepository().findAll(),
    ]);
  const pagos = filterPagos(pagosAll, usuario, contratos);
  const pagosServicio = filterPagosServicio(pagosServicioAll, usuario, contratos);
  const contratoIds = contratoIdsForUser(usuario, contratos);
  const soportesScope =
    usuario.rol === "ADMIN"
      ? soportesAll
      : soportesAll.filter((s) => contratoIds.has(s.contratoId));
  const mantenimiento = filterMantenimiento(
    mantenimientoAll,
    usuario,
    inmuebles,
    contratos
  );
  const notificaciones = filtroNotificacionesPorRol(
    notificacionesAll,
    rolEfectivo(usuario),
    usuario.email,
    contratoIds
  );

  const contratosActivosList = contratosScope.filter((c) => c.estado === "CONFIRMADO");
  const contratosPendientesConfirmacion = contratosScope.filter(
    (c) => c.estado === "PENDIENTE_CONFIRMACION"
  );
  const contratosRechazados = contratosScope.filter((c) => c.estado === "RECHAZADO");
  const invitacionesAll = await getInvitacionesContratoRepository().findAll();
  const solicitudesPendientes = invitacionesAll.filter(
    (i) =>
      i.estado === "PENDIENTE" &&
      i.emailInvitado.toLowerCase() === usuario.email.toLowerCase()
  ).length;
  const contratosProximosVencer = contratosActivosList.filter((c) =>
    contratoProximoAVencer(c)
  );
  const preavisosVencidos = contratosActivosList.filter((c) => preavisoVencido(c));

  return {
    totalInmuebles: inmueblesScope.length,
    inmueblesArrendados: inmueblesScope.filter((i) => i.estado === "ARRENDADO").length,
    contratosActivos: contratosActivosList.length,
    pagosPendientes: pagos.filter((p) => p.estado === "REPORTADO").length,
    pagosValidados: pagos.filter((p) => p.estado === "VALIDADO").length,
    pagosRechazados: pagos.filter((p) => p.estado === "RECHAZADO").length,
    soportesGenerados: soportesScope.length,
    mantenimientoAbierto: mantenimiento.filter((m) => m.estado === "ABIERTO").length,
    mantenimientoEnGestion: mantenimiento.filter((m) => m.estado === "EN_GESTION")
      .length,
    mantenimientoResuelto: mantenimiento.filter((m) => m.estado === "RESUELTO").length,
    mantenimientoCerrado: mantenimiento.filter((m) => m.estado === "CERRADO").length,
    mantenimientoRechazado: mantenimiento.filter((m) => m.estado === "RECHAZADO").length,
    comentariosMantenimientoRecientes: comentariosAll
      .filter((c) =>
        mantenimiento.some((m) => m.id === c.mantenimientoId)
      )
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
      .slice(0, 5),
    ingresosEstimados: contratosActivosList.reduce((sum, c) => sum + c.canonActual, 0),
    serviciosPendientesValidacion: pagosServicio.filter((p) => p.estado === "REPORTADO")
      .length,
    serviciosVencidos: pagosServicio.filter((p) => p.estado === "VENCIDO").length,
    serviciosValidados: pagosServicio.filter((p) => p.estado === "VALIDADO").length,
    serviciosRechazados: pagosServicio.filter((p) => p.estado === "RECHAZADO").length,
    serviciosProximosVencer: pagosProximosAVencer(pagosServicio),
    serviciosProximosVencerCount: pagosProximosAVencer(pagosServicio).length,
    serviciosReportadosLista: pagosServicio
      .filter((p) => p.estado === "REPORTADO")
      .slice(0, 5),
    serviciosVencidosLista: pagosServicio.filter((p) => p.estado === "VENCIDO").slice(0, 5),
    notificacionesPendientes: notificaciones.filter((n) => n.estado === "PENDIENTE").length,
    contratosProximosVencer,
    preavisosVencidos,
    contratosProximosVencerCount: contratosProximosVencer.length,
    preavisosVencidosCount: preavisosVencidos.length,
    contratosPendientesConfirmacionCount: contratosPendientesConfirmacion.length,
    contratosPendientesConfirmacion,
    contratosRechazadosCount: contratosRechazados.length,
    solicitudesPendientes,
  };
}

export async function getActividadReciente() {
  await requireSession();
  const eventos = await listarEventosRecientes(5);
  return eventos.map((e) => ({
    id: e.id,
    descripcion: e.descripcion,
    modulo: e.entidadTipo.replace(/_/g, " "),
    fecha: e.fechaHora.slice(0, 10),
    accion: e.accion,
    usuario: e.usuarioNombre,
  }));
}

export async function getIncidencias() {
  const ctx = await loadAccessContext();
  const rol = rolEfectivo(ctx.usuario);
  if (rol === "ARRENDATARIO" && ctx.contratoIds.size === 0) return [];
  if (rol === "ARRENDADOR" && ctx.contratoIds.size === 0 && ctx.inmuebleIds.size === 0) {
    return [];
  }
  const modulos = ACTIVIDAD_POR_ROL[rol];
  return seedIncidencias.filter((i) => modulos.includes(i.modulo));
}

export function resumenContratoAlerta(c: Contrato): string {
  return `${c.code} — vence ${c.fechaFin}`;
}
