"use server";

import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
} from "@/services/servicios.service";
import type { CreateInput, ServicioPublico, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearServicioAction(data: CreateInput<ServicioPublico>) {
  const created = await crearServicio(data);
  revalidatePath("/servicios");
  return created;
}

export async function actualizarServicioAction(
  id: string,
  data: UpdateInput<ServicioPublico>
) {
  const updated = await actualizarServicio(id, data);
  revalidatePath("/servicios");
  return updated;
}

export async function eliminarServicioAction(id: string) {
  await eliminarServicio(id);
  revalidatePath("/servicios");
}
