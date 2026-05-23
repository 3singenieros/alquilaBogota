import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessInmueble,
  filterInmuebles,
} from "@/lib/auth/scopes";
import { auditActorFromUsuario, getAuditActor } from "@/lib/audit/actor";
import {
  traceActualizacion,
  traceCreado,
  traceEliminado,
} from "@/lib/audit/trace-helper";
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
  const created = await getInmueblesRepository().create(data);
  const actor = auditActorFromUsuario(usuario);
  await traceCreado(
    actor,
    "INMUEBLE",
    created.id,
    `Inmueble ${created.code} creado (${created.titulo})`,
    { inmuebleId: created.id }
  );
  return created;
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
  const updated = await getInmueblesRepository().update(id, data);
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    await traceActualizacion(actor, "INMUEBLE", id, existing, updated, {
      descripcion: `Inmueble ${updated.code} actualizado`,
      estadoField: "estado",
      accionPorEstado: () => undefined,
      contexto: { inmuebleId: id },
      camposExtra: ["titulo", "direccion", "canonMensual", "estado"],
    });
    if (existing.estado !== updated.estado && updated.estado === "MANTENIMIENTO") {
      await traceActualizacion(actor, "INMUEBLE", id, existing, updated, {
        descripcion: `Inmueble ${updated.code} marcado en mantenimiento/inactivo`,
        estadoField: "estado",
        contexto: { inmuebleId: id },
      });
    }
  }
  return updated;
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
  const actor = await getAuditActor();
  await traceEliminado(
    actor,
    "INMUEBLE",
    id,
    `Inmueble ${existing.code} eliminado`,
    { inmuebleId: id }
  );
  return getInmueblesRepository().delete(id);
}
