import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessInmueble,
  filterInmuebles,
} from "@/lib/auth/scopes";
import { getInmueblesRepository } from "@/repositories";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

export async function listarInmuebles() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "inmuebles");
  const items = await getInmueblesRepository().findAll();
  return filterInmuebles(items, usuario);
}

export async function listarInmueblesReferencia() {
  const { usuario } = await requireSession();
  const items = await getInmueblesRepository().findAll();
  return filterInmuebles(items, usuario);
}

export async function obtenerInmueble(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "inmuebles");
  const item = await getInmueblesRepository().findById(id);
  if (!item || !canAccessInmueble(item, usuario)) return null;
  return item;
}

export async function crearInmueble(data: CreateInput<Inmueble>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "inmuebles");
  if (usuario.rol === "ARRENDADOR") {
    data = { ...data, arrendadorId: usuario.id };
  }
  if (usuario.rol !== "ADMIN" && usuario.rol !== "ARRENDADOR") {
    throw new AuthError("No puedes crear inmuebles", "FORBIDDEN");
  }
  return getInmueblesRepository().create(data);
}

export async function actualizarInmueble(id: string, data: UpdateInput<Inmueble>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "inmuebles");
  const existing = await getInmueblesRepository().findById(id);
  if (!existing || !canAccessInmueble(existing, usuario)) {
    throw new AuthError("Inmueble no encontrado o sin permiso", "FORBIDDEN");
  }
  if (usuario.rol === "ARRENDADOR") {
    data = { ...data, arrendadorId: usuario.id };
  }
  return getInmueblesRepository().update(id, data);
}

export async function eliminarInmueble(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "inmuebles");
  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("No puedes eliminar inmuebles", "FORBIDDEN");
  }
  const existing = await getInmueblesRepository().findById(id);
  if (!existing || !canAccessInmueble(existing, usuario)) {
    throw new AuthError("Inmueble no encontrado o sin permiso", "FORBIDDEN");
  }
  return getInmueblesRepository().delete(id);
}
