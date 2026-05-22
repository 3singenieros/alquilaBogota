"use server";

import {
  actualizarNoRenovacion,
  crearNoRenovacion,
} from "@/services/no-renovacion.service";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearNoRenovacionAction(data: CreateInput<NoRenovacion>) {
  await crearNoRenovacion(data);
  revalidatePath("/no-renovacion");
}

export async function actualizarNoRenovacionAction(id: string, data: UpdateInput<NoRenovacion>) {
  await actualizarNoRenovacion(id, data);
  revalidatePath("/no-renovacion");
}
