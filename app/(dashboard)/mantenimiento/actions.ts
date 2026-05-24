"use server";

import {
  actualizarContenidoMantenimiento,
  agregarComentarioMantenimiento,
  cambiarEstadoMantenimiento,
  crearMantenimiento,
  eliminarMantenimiento,
  listarInmueblesParaMantenimiento,
} from "@/services/mantenimiento.service";
import {
  cerrarMantenimientoTicket,
  definirResponsabilidadMantenimiento,
  responderResponsabilidadCompartida,
} from "@/services/mantenimiento-economico.service";
import type {
  ArchivoAdjunto,
  CreateInput,
  EstadoMantenimiento,
  Mantenimiento,
  UpdateInput,
} from "@/types";
import { revalidatePath } from "next/cache";

export async function listarInmueblesMantenimientoFormAction() {
  return listarInmueblesParaMantenimiento();
}

export async function crearMantenimientoAction(data: CreateInput<Mantenimiento>) {
  const created = await crearMantenimiento(data);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return created;
}

export async function actualizarContenidoMantenimientoAction(
  id: string,
  data: UpdateInput<Mantenimiento>
) {
  const updated = await actualizarContenidoMantenimiento(id, data);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return updated;
}

export async function cambiarEstadoMantenimientoAction(
  id: string,
  input: {
    estado: EstadoMantenimiento;
    asignadoA?: string;
    observacionesGestion?: string;
    motivoRechazo?: string;
  }
) {
  const updated = await cambiarEstadoMantenimiento(id, input);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return updated;
}

export async function agregarComentarioMantenimientoAction(
  mantenimientoId: string,
  input: { comentario: string; adjuntoUrl?: string }
) {
  const created = await agregarComentarioMantenimiento(mantenimientoId, input);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return created;
}

/** @deprecated Usar actualizarContenidoMantenimientoAction */
export async function actualizarMantenimientoAction(
  id: string,
  data: UpdateInput<Mantenimiento>
) {
  if (data.estado !== undefined) {
    return cambiarEstadoMantenimiento(id, {
      estado: data.estado,
      asignadoA: data.asignadoA,
      observacionesGestion: data.observacionesGestion,
    });
  }
  return actualizarContenidoMantenimiento(id, data);
}

export async function eliminarMantenimientoAction(id: string) {
  await eliminarMantenimiento(id);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
}

export async function definirResponsabilidadMantenimientoAction(
  id: string,
  input: Parameters<typeof definirResponsabilidadMantenimiento>[1]
) {
  const updated = await definirResponsabilidadMantenimiento(id, input);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return updated;
}

export async function responderResponsabilidadCompartidaAction(
  id: string,
  input: { aceptar: boolean; motivoRechazoResponsabilidad?: string }
) {
  const updated = await responderResponsabilidadCompartida(id, input);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return updated;
}

export async function cerrarMantenimientoTicketAction(
  id: string,
  input: {
    valorFinal?: number;
    fechaCierre: string;
    observacionesCierre?: string;
    documentosCierreAdjuntos?: ArchivoAdjunto[];
  }
) {
  const updated = await cerrarMantenimientoTicket(id, input);
  revalidatePath("/mantenimiento");
  revalidatePath("/");
  return updated;
}
