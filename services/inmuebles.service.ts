import { AuthError } from "@/lib/auth/errors";
import {
  traceActualizacion,
  traceCreado,
  traceEliminado,
  traceEvento,
} from "@/lib/audit/trace-helper";
import { auditActorFromUsuario, getAuditActor } from "@/lib/audit/actor";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessInmueble,
  filterInmuebles,
} from "@/lib/auth/scopes";
import {
  CIUDAD_PROTOTIPO,
  isLocalidadBogota,
  normalizeCiudadPrototipo,
} from "@/lib/inmueble-ubicacion";
import { getInmueblesRepository } from "@/repositories";
import type { CreateInput, Inmueble, UpdateInput } from "@/types";

const CAMPOS_UBICACION: (keyof Inmueble)[] = [
  "direccion",
  "localidad",
  "barrio",
  "estrato",
  "ciudad",
];

function normalizeInmuebleInput<T extends CreateInput<Inmueble> | UpdateInput<Inmueble>>(
  data: T
): T {
  const estratoRaw = data.estrato;
  const estrato =
    estratoRaw === undefined || estratoRaw === null || estratoRaw === ("" as unknown as number)
      ? undefined
      : Number(estratoRaw);

  return {
    ...data,
    ciudad: normalizeCiudadPrototipo(data.ciudad),
    localidad: data.localidad?.trim() || undefined,
    barrio: data.barrio?.trim() || undefined,
    estrato: estrato && estrato >= 1 && estrato <= 6 ? estrato : undefined,
  };
}

function assertLocalidadValida(localidad?: string) {
  if (localidad && !isLocalidadBogota(localidad)) {
    throw new AuthError("Localidad no válida para Bogotá D.C.", "FORBIDDEN");
  }
}

function diffUbicacion(antes: Inmueble, despues: Inmueble) {
  const valoresAnteriores: Record<string, unknown> = {};
  const valoresNuevos: Record<string, unknown> = {};
  let changed = false;
  for (const key of CAMPOS_UBICACION) {
    if (antes[key] !== despues[key]) {
      valoresAnteriores[key as string] = antes[key];
      valoresNuevos[key as string] = despues[key];
      changed = true;
    }
  }
  return changed ? { valoresAnteriores, valoresNuevos } : null;
}

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
  const payload = normalizeInmuebleInput(data);
  assertLocalidadValida(payload.localidad);
  const created = await getInmueblesRepository().create(payload);
  const actor = auditActorFromUsuario(usuario);
  await traceCreado(
    actor,
    "INMUEBLE",
    created.id,
    `Inmueble ${created.code} creado (${created.titulo}) — ${created.localidad ?? CIUDAD_PROTOTIPO}`,
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
  const payload = normalizeInmuebleInput(data);
  assertLocalidadValida(payload.localidad);
  const updated = await getInmueblesRepository().update(id, payload);
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    await traceActualizacion(actor, "INMUEBLE", id, existing, updated, {
      descripcion: `Inmueble ${updated.code} actualizado`,
      estadoField: "estado",
      accionPorEstado: () => undefined,
      contexto: { inmuebleId: id },
      camposExtra: ["titulo", "canonMensual", "estado", "tipo", "descripcion"],
    });
    const diff = diffUbicacion(existing, updated);
    if (diff) {
      await traceEvento(actor, {
        entidadTipo: "INMUEBLE",
        entidadId: id,
        accion: "INMUEBLE_ACTUALIZADO",
        descripcion: `Ubicación del inmueble ${updated.code} actualizada`,
        valoresAnteriores: diff.valoresAnteriores,
        valoresNuevos: diff.valoresNuevos,
        contexto: { inmuebleId: id },
      });
    }
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
