import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  filterServicios,
  inmuebleIdsForUser,
} from "@/lib/auth/scopes";
import { getInmueblesRepository, getServiciosRepository } from "@/repositories";
import type { CreateInput, ServicioPublico, UpdateInput } from "@/types";

async function assertInmuebleServicio(inmuebleId: string) {
  const { usuario } = await requireSession();
  const inmueble = await getInmueblesRepository().findById(inmuebleId);
  const allowed = inmuebleIdsForUser(
    usuario,
    inmueble ? [inmueble] : []
  );
  if (!allowed.has(inmuebleId)) {
    throw new AuthError("Inmueble no permitido para este usuario", "FORBIDDEN");
  }
}

export async function listarServicios() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "servicios");
  const { inmuebles } = await loadAuthContext();
  const items = await getServiciosRepository().findAll();
  return filterServicios(items, usuario, inmuebles);
}

export async function crearServicio(data: CreateInput<ServicioPublico>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "servicios");
  await assertInmuebleServicio(data.inmuebleId);
  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("No puedes registrar servicios públicos", "FORBIDDEN");
  }
  return getServiciosRepository().create(data);
}

export async function actualizarServicio(
  id: string,
  data: UpdateInput<ServicioPublico>
) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "servicios");
  const existing = await getServiciosRepository().findById(id);
  if (!existing) {
    throw new AuthError("Servicio no encontrado", "FORBIDDEN");
  }
  await assertInmuebleServicio(existing.inmuebleId);
  if (data.inmuebleId) await assertInmuebleServicio(data.inmuebleId);
  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("No puedes editar servicios públicos", "FORBIDDEN");
  }
  return getServiciosRepository().update(id, data);
}

export async function eliminarServicio(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "servicios");
  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("No puedes eliminar servicios públicos", "FORBIDDEN");
  }
  const existing = await getServiciosRepository().findById(id);
  if (!existing) return false;
  await assertInmuebleServicio(existing.inmuebleId);
  return getServiciosRepository().delete(id);
}
