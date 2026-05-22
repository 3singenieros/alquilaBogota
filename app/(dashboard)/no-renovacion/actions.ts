"use server";

import {
  actualizarNoRenovacion,
  crearNoRenovacion,
  eliminarNoRenovacion,
} from "@/services/no-renovacion.service";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearNoRenovacionAction(data: CreateInput<NoRenovacion>) {
  const created = await crearNoRenovacion(data);
  revalidatePath("/no-renovacion");
  return created;
}

export async function actualizarNoRenovacionAction(
  id: string,
  data: UpdateInput<NoRenovacion>
) {
  const updated = await actualizarNoRenovacion(id, data);
  revalidatePath("/no-renovacion");
  return updated;
}

export async function eliminarNoRenovacionAction(id: string) {
  await eliminarNoRenovacion(id);
  revalidatePath("/no-renovacion");
}
