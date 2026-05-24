"use server";

import {
  listarOpcionesReportes,
  obtenerReporte,
  registrarReporteGenerado,
} from "@/services/reportes.service";
import type { FiltrosReporte } from "@/types/reportes";

export async function listarOpcionesReportesAction() {
  return listarOpcionesReportes();
}

export async function generarVistaPreviaReporteAction(filtros: FiltrosReporte) {
  const reporte = await obtenerReporte(filtros);
  await registrarReporteGenerado(reporte, filtros);
  return reporte;
}

export async function registrarDescargaReporteAction(filtros: FiltrosReporte) {
  const reporte = await obtenerReporte(filtros);
  await registrarReporteGenerado(reporte, filtros);
  return reporte;
}
