import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  filterContratos,
  filterMantenimiento,
  inmuebleIdsForUser,
} from "@/lib/auth/scopes";
import {
  getInmueblesRepository,
  getMantenimientoRepository,
} from "@/repositories";
import type { CreateInput, Mantenimiento, UpdateInput } from "@/types";

async function assertInmuebleMantenimiento(inmuebleId: string) {
  const { usuario } = await requireSession();
  if (usuario.rol === "ARRENDATARIO") {
    const { contratos } = await loadAuthContext();
    const allowedInm = new Set(
      filterContratos(contratos, usuario).map((c) => c.inmuebleId)
    );
    if (!allowedInm.has(inmuebleId)) {
      throw new AuthError("Solo puedes solicitar mantenimiento de tu inmueble arrendado", "FORBIDDEN");
    }
    return;
  }
  const inmueble = await getInmueblesRepository().findById(inmuebleId);
  const allowed = inmuebleIdsForUser(usuario, inmueble ? [inmueble] : []);
  if (!allowed.has(inmuebleId)) {
    throw new AuthError("Inmueble no permitido para este usuario", "FORBIDDEN");
  }
}

export async function listarMantenimiento() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "mantenimiento");
  const { inmuebles } = await loadAuthContext();
  const items = await getMantenimientoRepository().findAll();
  return filterMantenimiento(items, usuario, inmuebles);
}

export async function crearMantenimiento(data: CreateInput<Mantenimiento>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "mantenimiento");
  await assertInmuebleMantenimiento(data.inmuebleId);
  if (usuario.rol === "ARRENDATARIO") {
    data = { ...data, solicitadoPorId: usuario.id };
  }
  return getMantenimientoRepository().create(data);
}

export async function actualizarMantenimiento(
  id: string,
  data: UpdateInput<Mantenimiento>
) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "mantenimiento");
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) {
    throw new AuthError("Registro no encontrado", "FORBIDDEN");
  }
  if (
    usuario.rol === "ARRENDATARIO" &&
    existing.solicitadoPorId !== usuario.id
  ) {
    throw new AuthError("Solo puedes editar tus solicitudes", "FORBIDDEN");
  }
  await assertInmuebleMantenimiento(existing.inmuebleId);
  if (data.inmuebleId) await assertInmuebleMantenimiento(data.inmuebleId);
  return getMantenimientoRepository().update(id, data);
}

export async function eliminarMantenimiento(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "mantenimiento");
  if (usuario.rol !== "ADMIN") {
    throw new AuthError("No puedes eliminar registros de mantenimiento", "FORBIDDEN");
  }
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) return false;
  return getMantenimientoRepository().delete(id);
}
