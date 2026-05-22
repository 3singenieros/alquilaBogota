"use server";

import { actualizarPago, crearPago, eliminarPago } from "@/services/pagos.service";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearPagoAction(data: CreateInput<PagoReportado>) {
  await crearPago(data);
  revalidatePath("/pagos");
}

export async function actualizarPagoAction(id: string, data: UpdateInput<PagoReportado>) {
  await actualizarPago(id, data);
  revalidatePath("/pagos");
}

export async function eliminarPagoAction(id: string) {
  await eliminarPago(id);
  revalidatePath("/pagos");
}
