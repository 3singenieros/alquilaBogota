"use server";

import {
  actualizarMantenimiento,
  crearMantenimiento,
  eliminarMantenimiento,
} from "@/services/mantenimiento.service";
import type { CreateInput, Mantenimiento, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearMantenimientoAction(data: CreateInput<Mantenimiento>) {
  const created = await crearMantenimiento(data);
  revalidatePath("/mantenimiento");
  return created;
}

export async function actualizarMantenimientoAction(
  id: string,
  data: UpdateInput<Mantenimiento>
) {
  const updated = await actualizarMantenimiento(id, data);
  revalidatePath("/mantenimiento");
  return updated;
}

export async function eliminarMantenimientoAction(id: string) {
  await eliminarMantenimiento(id);
  revalidatePath("/mantenimiento");
}
