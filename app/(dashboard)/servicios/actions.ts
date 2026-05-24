"use server";

import {
  listarPagosServicio,
  rechazarPagoServicio,
  reportarPagoServicio,
  validarPagoServicio,
} from "@/services/pagos-servicio.service";
import { listarServiciosContrato } from "@/services/servicios-contrato.service";
import type { ArchivoAdjunto } from "@/types";
import { revalidatePath } from "next/cache";

export async function listarServiciosContratoAction(contratoId?: string) {
  return listarServiciosContrato(contratoId);
}

export async function reportarPagoServicioAction(input: {
  servicioPublicoContratoId: string;
  periodo: string;
  fechaPago: string;
  valorPagado: number;
  comprobanteUrl?: string;
  comprobantesAdjuntos?: ArchivoAdjunto[];
  fechaVencimiento?: string;
  observaciones?: string;
}) {
  const created = await reportarPagoServicio(input);
  revalidatePath("/servicios");
  revalidatePath("/");
  return created;
}

export async function validarPagoServicioAction(id: string, observaciones?: string) {
  const updated = await validarPagoServicio(id, observaciones);
  revalidatePath("/servicios");
  revalidatePath("/");
  return updated;
}

export async function rechazarPagoServicioAction(id: string, motivoRechazo: string) {
  const updated = await rechazarPagoServicio(id, motivoRechazo);
  revalidatePath("/servicios");
  revalidatePath("/");
  return updated;
}

export async function listarPagosServicioAction() {
  return listarPagosServicio();
}
