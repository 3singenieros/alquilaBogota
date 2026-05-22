import { seedActividad, seedIncidencias } from "@/data/mock/seed";
import { loadAuthContext } from "@/lib/auth/load-context";
import {
  filterContratos,
  filterInmuebles,
  filterMantenimiento,
  filterPagos,
} from "@/lib/auth/scopes";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { getMantenimientoRepository, getPagosRepository } from "@/repositories";
import type { Rol } from "@/types";

const ACTIVIDAD_POR_ROL: Record<Rol, string[]> = {
  ADMIN: ["Pagos", "Mantenimiento", "Contratos", "Servicios públicos", "No renovación"],
  ARRENDADOR: ["Pagos", "Mantenimiento", "Contratos"],
  ARRENDATARIO: ["Pagos", "Mantenimiento", "No renovación"],
};

export async function getDashboardResumen() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "dashboard");

  const { contratos, inmuebles } = await loadAuthContext();
  const inmueblesScope = filterInmuebles(inmuebles, usuario);
  const contratosScope = filterContratos(contratos, usuario);
  const [pagosAll, mantenimientoAll] = await Promise.all([
    getPagosRepository().findAll(),
    getMantenimientoRepository().findAll(),
  ]);
  const pagos = filterPagos(pagosAll, usuario, contratos);
  const mantenimiento = filterMantenimiento(mantenimientoAll, usuario, inmuebles);

  const contratosActivos = contratosScope.filter((c) => c.estado === "ACTIVO").length;
  const pagosPendientes = pagos.filter((p) => p.estado === "REPORTADO").length;
  const mantenimientoAbierto = mantenimiento.filter(
    (m) => m.estado === "ABIERTO" || m.estado === "EN_PROGRESO"
  ).length;

  return {
    totalInmuebles: inmueblesScope.length,
    inmueblesArrendados: inmueblesScope.filter((i) => i.estado === "ARRENDADO").length,
    contratosActivos,
    pagosPendientes,
    mantenimientoAbierto,
    ingresosEstimados: contratosScope
      .filter((c) => c.estado === "ACTIVO")
      .reduce((sum, c) => sum + c.canonMensual, 0),
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
