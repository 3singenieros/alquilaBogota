"use server";

import {
  crearPago,
  rechazarPago,
  validarPago,
} from "@/services/pagos.service";
import { obtenerDatosPdfSoporte } from "@/services/soporte-pago.service";
import type { CreateInput, PagoReportado } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearPagoAction(data: CreateInput<PagoReportado>) {
  const created = await crearPago(data);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/notificaciones");
  return created;
}

export async function validarPagoAction(pagoId: string, observaciones?: string) {
  const result = await validarPago(pagoId, observaciones);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/notificaciones");
  return result;
}

export async function rechazarPagoAction(pagoId: string, motivoRechazo: string) {
  const updated = await rechazarPago(pagoId, motivoRechazo);
  revalidatePath("/pagos");
  revalidatePath("/");
  revalidatePath("/notificaciones");
  return updated;
}

export async function obtenerDatosPdfSoporteAction(soporteId: string) {
  return obtenerDatosPdfSoporte(soporteId);
}
