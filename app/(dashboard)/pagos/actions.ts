"use server";

import { actualizarPago, crearPago, eliminarPago } from "@/services/pagos.service";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearPagoAction(data: CreateInput<PagoReportado>) {
  const created = await crearPago(data);
  revalidatePath("/pagos");
  return created;
}

export async function actualizarPagoAction(id: string, data: UpdateInput<PagoReportado>) {
  const updated = await actualizarPago(id, data);
  revalidatePath("/pagos");
  return updated;
}

export async function eliminarPagoAction(id: string) {
  await eliminarPago(id);
  revalidatePath("/pagos");
}
