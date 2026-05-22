"use server";

import {
  actualizarMantenimiento,
  crearMantenimiento,
  eliminarMantenimiento,
} from "@/services/mantenimiento.service";
import type { CreateInput, Mantenimiento, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearMantenimientoAction(data: CreateInput<Mantenimiento>) {
  await crearMantenimiento(data);
  revalidatePath("/mantenimiento");
}

export async function actualizarMantenimientoAction(id: string, data: UpdateInput<Mantenimiento>) {
  await actualizarMantenimiento(id, data);
  revalidatePath("/mantenimiento");
}

export async function eliminarMantenimientoAction(id: string) {
  await eliminarMantenimiento(id);
  revalidatePath("/mantenimiento");
}
