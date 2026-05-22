import { AuthError } from "@/lib/auth/errors";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { getUsuariosRepository } from "@/repositories";
import type { CreateInput, UpdateInput, Usuario } from "@/types";

export async function listarUsuarios() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "usuarios");
  return getUsuariosRepository().findAll();
}

export async function crearUsuario(data: CreateInput<Usuario>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "usuarios");
  return getUsuariosRepository().create(data);
}

export async function actualizarUsuario(id: string, data: UpdateInput<Usuario>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "usuarios");
  return getUsuariosRepository().update(id, data);
}

export async function eliminarUsuario(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "usuarios");
  if (id === usuario.id) {
    throw new AuthError("No puedes eliminar tu propio usuario", "FORBIDDEN");
  }
  return getUsuariosRepository().delete(id);
}
