import type { AuditActor } from "@/lib/audit/actor";
import { AuthError } from "@/lib/auth/errors";
import { rolEfectivo } from "@/lib/auth/rol";
import { canAccessContrato } from "@/lib/auth/scopes";
import { eventoRelacionadoNoRenovacion } from "@/lib/reportes/historial-no-renovacion";
import { getNoRenovacionRepository, getTrazabilidadRepository } from "@/repositories";
import {
  assertAccessContrato,
  assertAccessEntidad,
  assertAccessInmueble,
  filterTrazabilidadEvents,
  loadAccessContext,
} from "@/services/access-control.service";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import type {
  AccionTrazabilidad,
  EntidadTipoTrazabilidad,
  EventoTrazabilidad,
  RegistrarEventoInput,
} from "@/types/trazabilidad";

function actorToEvento(actor: AuditActor): Pick<
  RegistrarEventoInput,
  "usuarioId" | "usuarioNombre" | "usuarioEmail" | "usuarioRol"
> {
  return {
    usuarioId: actor.usuarioId,
    usuarioNombre: actor.usuarioNombre,
    usuarioEmail: actor.usuarioEmail,
    usuarioRol: actor.usuarioRol,
  };
}

export async function registrarEvento(
  input: RegistrarEventoInput
): Promise<EventoTrazabilidad> {
  return getTrazabilidadRepository().create(input);
}

export async function registrarCambioEstado(input: {
  entidadTipo: EntidadTipoTrazabilidad;
  entidadId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  descripcion: string;
  accionEspecifica?: AccionTrazabilidad;
  contratoId?: string;
  inmuebleId?: string;
  pagoId?: string;
  usuarioAfectadoId?: string;
  valoresAnteriores?: Record<string, unknown>;
  valoresNuevos?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actor: AuditActor;
}) {
  const accion = input.accionEspecifica ?? "ESTADO_CAMBIADO";
  return registrarEvento({
    entidadTipo: input.entidadTipo,
    entidadId: input.entidadId,
    accion,
    estadoAnterior: input.estadoAnterior,
    estadoNuevo: input.estadoNuevo,
    descripcion: input.descripcion,
    contratoId: input.contratoId,
    inmuebleId: input.inmuebleId,
    pagoId: input.pagoId,
    usuarioAfectadoId: input.usuarioAfectadoId,
    valoresAnteriores: input.valoresAnteriores ?? { estado: input.estadoAnterior },
    valoresNuevos: input.valoresNuevos ?? { estado: input.estadoNuevo },
    metadata: input.metadata,
    ...actorToEvento(input.actor),
  });
}

export async function filtrarPorAlcanceUsuario(
  items: EventoTrazabilidad[]
): Promise<EventoTrazabilidad[]> {
  const ctx = await loadAccessContext();
  return filterTrazabilidadEvents(ctx, items);
}

export async function listarEventos() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "trazabilidad");
  const items = await getTrazabilidadRepository().findAll();
  return filtrarPorAlcanceUsuario(items);
}

export async function listarEventosPorContrato(contratoId: string) {
  await assertAccessContrato(contratoId);
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.contratoId === contratoId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarEventosPorInmueble(inmuebleId: string) {
  await assertAccessInmueble(inmuebleId);
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.inmuebleId === inmuebleId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarHistorialMantenimiento(mantenimientoId: string) {
  await assertAccessEntidad("MANTENIMIENTO", mantenimientoId);
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter(
      (e) => e.entidadTipo === "MANTENIMIENTO" && e.entidadId === mantenimientoId
    )
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

/** Historial del servicio base y de todos sus pagos reportados. */
export async function listarHistorialServicioContrato(servicioContratoId: string) {
  await assertAccessEntidad("SERVICIO_PUBLICO", servicioContratoId);
  const { getPagosServicioRepository } = await import("@/repositories");
  const pagos = await getPagosServicioRepository().findByServicioContratoId(
    servicioContratoId
  );
  const pagoIds = new Set(pagos.map((p) => p.id));
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter(
      (e) =>
        (e.entidadTipo === "SERVICIO_PUBLICO" && e.entidadId === servicioContratoId) ||
        (e.entidadTipo === "PAGO_SERVICIO_PUBLICO" && pagoIds.has(e.entidadId))
    )
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarHistorialNoRenovacion(noRenovacionId: string) {
  const { usuario } = await requireSession();
  const nr = await getNoRenovacionRepository().findById(noRenovacionId);
  if (!nr) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  const { getContratosRepository } = await import("@/repositories");
  const contrato = await getContratosRepository().findById(nr.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Sin permiso sobre este expediente", "FORBIDDEN");
  }

  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => eventoRelacionadoNoRenovacion(e, nr))
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarEventosPorEntidad(
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string
) {
  await assertAccessEntidad(entidadTipo, entidadId);
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.entidadTipo === entidadTipo && e.entidadId === entidadId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarEventosPorUsuario(usuarioId: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "trazabilidad");
  if (rolEfectivo(usuario) !== "ADMIN" && usuarioId !== usuario.id) {
    throw new AuthError("Sin permiso para ver eventos de otro usuario", "FORBIDDEN");
  }
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.usuarioId === usuarioId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarEventosPorRangoFechas(
  fechaInicio: string,
  fechaFin: string
) {
  const items = await listarEventos();
  return items.filter(
    (e) => e.fechaHora >= fechaInicio && e.fechaHora <= fechaFin
  );
}

export async function listarEventosRecientes(limit = 10) {
  const { usuario } = await requireSession();
  if (rolEfectivo(usuario) === "ADMIN" || rolEfectivo(usuario) === "ARRENDADOR") {
    try {
      assertModuleAccess(usuario.rol, "trazabilidad");
    } catch {
      /* dashboard puede llamar sin módulo trazabilidad para arrendador */
    }
  }
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora))
    .slice(0, limit);
}
