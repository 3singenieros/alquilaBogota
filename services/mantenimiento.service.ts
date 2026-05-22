import { getMantenimientoRepository } from "@/repositories";
import type { CreateInput, Mantenimiento, UpdateInput } from "@/types";

export async function listarMantenimiento() {
  return getMantenimientoRepository().findAll();
}

export async function crearMantenimiento(data: CreateInput<Mantenimiento>) {
  return getMantenimientoRepository().create(data);
}

export async function actualizarMantenimiento(id: string, data: UpdateInput<Mantenimiento>) {
  return getMantenimientoRepository().update(id, data);
}

export async function eliminarMantenimiento(id: string) {
  return getMantenimientoRepository().delete(id);
}
