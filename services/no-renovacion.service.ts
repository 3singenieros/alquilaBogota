import { getNoRenovacionRepository } from "@/repositories";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";

export async function listarNoRenovacion() {
  return getNoRenovacionRepository().findAll();
}

export async function crearNoRenovacion(data: CreateInput<NoRenovacion>) {
  return getNoRenovacionRepository().create(data);
}

export async function actualizarNoRenovacion(id: string, data: UpdateInput<NoRenovacion>) {
  return getNoRenovacionRepository().update(id, data);
}

export async function eliminarNoRenovacion(id: string) {
  return getNoRenovacionRepository().delete(id);
}
