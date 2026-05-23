import { seedActividad, seedIncidencias } from "@/data/mock/seed";
import { contratoProximoAVencer, preavisoVencido } from "@/lib/contrato-alertas";
import { loadAuthContext } from "@/lib/auth/load-context";
import {
  contratoIdsForUser,
  filterContratos,
  filterInmuebles,
  filterMantenimiento,
  filterPagos,
} from "@/lib/auth/scopes";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  getInvitacionesContratoRepository,
  getMantenimientoRepository,
  getNotificacionesRepository,
  getPagosRepository,
  getServiciosRepository,
  getSoportePagoRepository,
} from "@/repositories";
import { filtroNotificacionesPorRol } from "@/services/notificaciones.service";
import type { Contrato, Rol } from "@/types";

const ACTIVIDAD_POR_ROL: Record<Rol, string[]> = {
  ADMIN: ["Pagos", "Mantenimiento", "Contratos", "Servicios públicos", "No renovación", "Notificaciones"],
  ARRENDADOR: ["Pagos", "Mantenimiento", "Contratos", "Notificaciones"],
  ARRENDATARIO: ["Pagos", "Mantenimiento", "No renovación", "Notificaciones"],
};

export async function getDashboardResumen() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "dashboard");

  const { contratos, inmuebles } = await loadAuthContext();
  const inmueblesScope = filterInmuebles(inmuebles, usuario);
  const contratosScope = filterContratos(contratos, usuario);
  const [pagosAll, mantenimientoAll, serviciosAll, notificacionesAll, soportesAll] =
    await Promise.all([
      getPagosRepository().findAll(),
      getMantenimientoRepository().findAll(),
      getServiciosRepository().findAll(),
      getNotificacionesRepository().findAll(),
      getSoportePagoRepository().findAll(),
    ]);
  const pagos = filterPagos(pagosAll, usuario, contratos);
  const contratoIds = contratoIdsForUser(usuario, contratos);
  const soportesScope =
    usuario.rol === "ADMIN"
      ? soportesAll
      : soportesAll.filter((s) => contratoIds.has(s.contratoId));
  const mantenimiento = filterMantenimiento(mantenimientoAll, usuario, inmuebles);
  const servicios = serviciosAll.filter((s) =>
    inmueblesScope.some((i) => i.id === s.inmuebleId)
  );
  const notificaciones = filtroNotificacionesPorRol(
    notificacionesAll,
    usuario.rol,
    usuario.email
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
    mantenimientoAbierto: mantenimiento.filter(
      (m) => m.estado === "ABIERTO" || m.estado === "EN_PROGRESO"
    ).length,
    ingresosEstimados: contratosActivosList.reduce((sum, c) => sum + c.canonActual, 0),
    serviciosVencidos: servicios.filter((s) => s.estado === "VENCIDO").length,
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
  const { usuario } = await requireSession();
  const modulos = ACTIVIDAD_POR_ROL[usuario.rol];
  return seedActividad.filter((a) => modulos.includes(a.modulo));
}

export async function getIncidencias() {
  const { usuario } = await requireSession();
  const modulos = ACTIVIDAD_POR_ROL[usuario.rol];
  return seedIncidencias.filter((i) => modulos.includes(i.modulo));
}

export function resumenContratoAlerta(c: Contrato): string {
  return `${c.code} — vence ${c.fechaFin}`;
}
