"use server";

import {
  listarEventosPorContrato,
  listarEventosPorInmueble,
  listarHistorialMantenimiento,
  listarHistorialServicioContrato,
} from "@/services/trazabilidad.service";

export async function listarHistorialContratoAction(contratoId: string) {
  return listarEventosPorContrato(contratoId);
}

export async function listarHistorialInmuebleAction(inmuebleId: string) {
  return listarEventosPorInmueble(inmuebleId);
}

export async function listarHistorialServicioAction(servicioContratoId: string) {
  return listarHistorialServicioContrato(servicioContratoId);
}

export async function listarHistorialMantenimientoAction(mantenimientoId: string) {
  return listarHistorialMantenimiento(mantenimientoId);
}
