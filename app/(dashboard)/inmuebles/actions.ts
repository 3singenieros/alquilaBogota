"use server";

import {
  actualizarInmueble,
  crearInmueble,
  eliminarInmueble,
} from "@/services/inmuebles.service";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearInmuebleAction(data: CreateInput<Inmueble>) {
  await crearInmueble(data);
  revalidatePath("/inmuebles");
}

export async function actualizarInmuebleAction(id: string, data: UpdateInput<Inmueble>) {
  await actualizarInmueble(id, data);
  revalidatePath("/inmuebles");
}

export async function eliminarInmuebleAction(id: string) {
  await eliminarInmueble(id);
  revalidatePath("/inmuebles");
}
