"use server";

import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
} from "@/services/servicios.service";
import type { CreateInput, ServicioPublico, UpdateInput } from "@/types";
import { revalidatePath } from "next/cache";

export async function crearServicioAction(data: CreateInput<ServicioPublico>) {
  await crearServicio(data);
  revalidatePath("/servicios");
}

export async function actualizarServicioAction(id: string, data: UpdateInput<ServicioPublico>) {
  await actualizarServicio(id, data);
  revalidatePath("/servicios");
}

export async function eliminarServicioAction(id: string) {
  await eliminarServicio(id);
  revalidatePath("/servicios");
}
