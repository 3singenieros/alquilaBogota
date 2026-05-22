"use server";

import {
  actualizarInmueble,
  crearInmueble,
  eliminarInmueble,
} from "@/services/inmuebles.service";
import { revalidateInmuebleDependents } from "@/lib/revalidate-paths";
import { listarInmueblesReferencia } from "@/services/inmuebles.service";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

export async function listarInmueblesFormAction() {
  return listarInmueblesReferencia();
}

export async function crearInmuebleAction(data: CreateInput<Inmueble>) {
  const created = await crearInmueble(data);
  revalidateInmuebleDependents();
  return created;
}

export async function actualizarInmuebleAction(id: string, data: UpdateInput<Inmueble>) {
  const updated = await actualizarInmueble(id, data);
  revalidateInmuebleDependents();
  return updated;
}

export async function eliminarInmuebleAction(id: string) {
  await eliminarInmueble(id);
  revalidateInmuebleDependents();
}
