import { seedActividad, seedIncidencias } from "@/data/mock/seed";
import {
  getContratosRepository,
  getInmueblesRepository,
  getMantenimientoRepository,
  getPagosRepository,
} from "@/repositories";

export async function getDashboardResumen() {
  const [inmuebles, contratos, pagos, mantenimiento] = await Promise.all([
    getInmueblesRepository().findAll(),
    getContratosRepository().findAll(),
    getPagosRepository().findAll(),
    getMantenimientoRepository().findAll(),
  ]);

  const contratosActivos = contratos.filter((c) => c.estado === "ACTIVO").length;
  const pagosPendientes = pagos.filter((p) => p.estado === "REPORTADO").length;
  const mantenimientoAbierto = mantenimiento.filter(
    (m) => m.estado === "ABIERTO" || m.estado === "EN_PROGRESO"
  ).length;

  return {
    totalInmuebles: inmuebles.length,
    inmueblesArrendados: inmuebles.filter((i) => i.estado === "ARRENDADO").length,
    contratosActivos,
    pagosPendientes,
    mantenimientoAbierto,
    ingresosEstimados: contratos
      .filter((c) => c.estado === "ACTIVO")
      .reduce((sum, c) => sum + c.canonMensual, 0),
  };
}

export async function getActividadReciente() {
  return seedActividad;
}

export async function getIncidencias() {
  return seedIncidencias;
}
