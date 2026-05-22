import { getServiciosRepository } from "@/repositories";
import type { CreateInput, ServicioPublico, UpdateInput } from "@/types";

export async function listarServicios() {
  return getServiciosRepository().findAll();
}

export async function crearServicio(data: CreateInput<ServicioPublico>) {
  return getServiciosRepository().create(data);
}

export async function actualizarServicio(id: string, data: UpdateInput<ServicioPublico>) {
  return getServiciosRepository().update(id, data);
}

export async function eliminarServicio(id: string) {
  return getServiciosRepository().delete(id);
}
