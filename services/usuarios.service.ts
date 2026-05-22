import { getUsuariosRepository } from "@/repositories";
import type { CreateInput, UpdateInput, Usuario } from "@/types";

export async function listarUsuarios() {
  return getUsuariosRepository().findAll();
}

export async function crearUsuario(data: CreateInput<Usuario>) {
  return getUsuariosRepository().create(data);
}

export async function actualizarUsuario(id: string, data: UpdateInput<Usuario>) {
  return getUsuariosRepository().update(id, data);
}

export async function eliminarUsuario(id: string) {
  return getUsuariosRepository().delete(id);
}
