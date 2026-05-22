import { getInmueblesRepository } from "@/repositories";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

export async function listarInmuebles() {
  return getInmueblesRepository().findAll();
}

export async function obtenerInmueble(id: string) {
  return getInmueblesRepository().findById(id);
}

export async function crearInmueble(data: CreateInput<Inmueble>) {
  return getInmueblesRepository().create(data);
}

export async function actualizarInmueble(id: string, data: UpdateInput<Inmueble>) {
  return getInmueblesRepository().update(id, data);
}

export async function eliminarInmueble(id: string) {
  return getInmueblesRepository().delete(id);
}
