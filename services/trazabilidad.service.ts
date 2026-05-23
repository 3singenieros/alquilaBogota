import type { AuditActor } from "@/lib/audit/actor";
import { loadAuthContext } from "@/lib/auth/load-context";
import {
  contratoIdsForUser,
  inmuebleIdsForUser,
} from "@/lib/auth/scopes";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { getTrazabilidadRepository } from "@/repositories";
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

async function filtrarPorAlcanceUsuario(
  items: EventoTrazabilidad[]
): Promise<EventoTrazabilidad[]> {
  const { usuario } = await requireSession();
  if (usuario.rol === "ADMIN") return items;

  const { contratos, inmuebles } = await loadAuthContext();
  const cIds = contratoIdsForUser(usuario, contratos);
  const iIds = inmuebleIdsForUser(usuario, inmuebles);

  return items.filter(
    (e) =>
      (e.contratoId && cIds.has(e.contratoId)) ||
      (e.inmuebleId && iIds.has(e.inmuebleId)) ||
      e.usuarioId === usuario.id
  );
}

export async function listarEventos() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "trazabilidad");
  const items = await getTrazabilidadRepository().findAll();
  return filtrarPorAlcanceUsuario(items);
}

export async function listarEventosPorContrato(contratoId: string) {
  await requireSession();
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.contratoId === contratoId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarEventosPorInmueble(inmuebleId: string) {
  await requireSession();
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.inmuebleId === inmuebleId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarHistorialMantenimiento(mantenimientoId: string) {
  await requireSession();
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
  await requireSession();
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

export async function listarEventosPorEntidad(
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string
) {
  await requireSession();
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped
    .filter((e) => e.entidadTipo === entidadTipo && e.entidadId === entidadId)
    .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

export async function listarEventosPorUsuario(usuarioId: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "trazabilidad");
  const items = await getTrazabilidadRepository().findAll();
  return items
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
  if (usuario.rol === "ADMIN" || usuario.rol === "ARRENDADOR") {
    try {
      assertModuleAccess(usuario.rol, "trazabilidad");
    } catch {
      /* dashboard puede llamar sin módulo trazabilidad para arrendador */
    }
  }
  const items = await getTrazabilidadRepository().findAll();
  const scoped = await filtrarPorAlcanceUsuario(items);
  return scoped.slice(0, limit);
}
