/**
 * Control de acceso por rol y relación contractual (mock / servicios).
 * Al conectar Supabase/PostgreSQL, reforzar con Row Level Security o validaciones en backend.
 */

import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { rolEfectivo } from "@/lib/auth/rol";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { requireSession } from "@/services/auth.service";
import {
  getContratosRepository,
  getInmueblesRepository,
  getInvitacionesContratoRepository,
  getMantenimientoRepository,
  getNoRenovacionRepository,
  getNotificacionesRepository,
  getPagosRepository,
  getPagosServicioRepository,
  getTrazabilidadRepository,
} from "@/repositories";
import type {
  Contrato,
  Inmueble,
  InvitacionContrato,
  Mantenimiento,
  NoRenovacion,
  Notificacion,
  PagoReportado,
  PagoServicioPublico,
  Rol,
  Usuario,
} from "@/types";
import type { EntidadTipoTrazabilidad, EventoTrazabilidad } from "@/types/trazabilidad";

export type AccessContext = {
  usuario: Usuario;
  contratos: Contrato[];
  inmuebles: Inmueble[];
  invitaciones: InvitacionContrato[];
  contratoIds: Set<string>;
  inmuebleIds: Set<string>;
  tieneContratosVinculados: boolean;
  tieneInvitacionesPendientes: boolean;
};

function emailNorm(email: string): string {
  return email.trim().toLowerCase();
}

export function filterContratosByUser(
  contratos: Contrato[],
  usuario: Usuario
): Contrato[] {
  const rol = rolEfectivo(usuario);
  if (rol === "ADMIN") return contratos;
  if (rol === "ARRENDADOR") {
    return contratos.filter((c) => c.arrendadorId === usuario.id);
  }
  if (rol === "ARRENDATARIO") {
    const email = emailNorm(usuario.email);
    return contratos.filter(
      (c) =>
        (c.arrendatarioId && c.arrendatarioId === usuario.id) ||
        emailNorm(c.emailArrendatario ?? "") === email
    );
  }
  return [];
}

export function filterInmueblesByUser(
  inmuebles: Inmueble[],
  usuario: Usuario,
  contratosAccesibles?: Contrato[]
): Inmueble[] {
  const rol = rolEfectivo(usuario);
  if (rol === "ADMIN") return inmuebles;
  if (rol === "ARRENDADOR") {
    return inmuebles.filter((i) => i.arrendadorId === usuario.id);
  }
  if (rol === "ARRENDATARIO") {
    const contratos = contratosAccesibles ?? [];
    const ids = new Set(
      contratos
        .filter((c) => c.estado === "CONFIRMADO" || c.estado === "PENDIENTE_CONFIRMACION")
        .map((c) => c.inmuebleId)
    );
    return inmuebles.filter((i) => ids.has(i.id));
  }
  return [];
}

export function buildAccessContext(
  usuario: Usuario,
  data: {
    contratos: Contrato[];
    inmuebles: Inmueble[];
    invitaciones: InvitacionContrato[];
  }
): AccessContext {
  const contratos = filterContratosByUser(data.contratos, usuario);
  const inmuebles = filterInmueblesByUser(data.inmuebles, usuario, contratos);
  const email = emailNorm(usuario.email);
  const invitaciones = data.invitaciones.filter(
    (i) => emailNorm(i.emailInvitado) === email
  );
  const tieneInvitacionesPendientes = invitaciones.some((i) => i.estado === "PENDIENTE");
  const tieneContratosVinculados =
    contratos.some((c) => c.estado === "CONFIRMADO") || tieneInvitacionesPendientes;

  return {
    usuario,
    contratos,
    inmuebles,
    invitaciones,
    contratoIds: new Set(contratos.map((c) => c.id)),
    inmuebleIds: new Set(inmuebles.map((i) => i.id)),
    tieneContratosVinculados,
    tieneInvitacionesPendientes,
  };
}

export async function loadAccessContext(usuario?: Usuario): Promise<AccessContext> {
  const user = usuario ?? (await requireSession()).usuario;
  const { contratos, inmuebles } = await loadAuthContext();
  const invitaciones = await getInvitacionesContratoRepository().findAll();
  return buildAccessContext(user, { contratos, inmuebles, invitaciones });
}

export function getAccessibleContratoIds(ctx: AccessContext): Set<string> {
  return ctx.contratoIds;
}

export function getAccessibleInmuebleIds(ctx: AccessContext): Set<string> {
  return ctx.inmuebleIds;
}

export function canAccessContrato(ctx: AccessContext, contratoId: string): boolean {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return true;
  return ctx.contratoIds.has(contratoId);
}

export function canAccessInmueble(ctx: AccessContext, inmuebleId: string): boolean {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return true;
  return ctx.inmuebleIds.has(inmuebleId);
}

function isEventoPersonal(e: EventoTrazabilidad, usuario: Usuario): boolean {
  const email = emailNorm(usuario.email);
  if (e.usuarioId === usuario.id) return true;
  if (emailNorm(e.usuarioEmail) === email) return true;
  const metaEmail = e.metadata?.destinatarioEmail;
  if (typeof metaEmail === "string" && emailNorm(metaEmail) === email) return true;
  if (e.entidadTipo === "USUARIO" && e.entidadId === usuario.id) return true;
  return false;
}

export function canSeeTrazabilidadEvent(
  ctx: AccessContext,
  evento: EventoTrazabilidad
): boolean {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return true;

  if (evento.contratoId) {
    return ctx.contratoIds.has(evento.contratoId);
  }

  if (evento.inmuebleId) {
    return ctx.inmuebleIds.has(evento.inmuebleId);
  }

  return isEventoPersonal(evento, ctx.usuario);
}

export function filterTrazabilidadEvents(
  ctx: AccessContext,
  eventos: EventoTrazabilidad[]
): EventoTrazabilidad[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return eventos;
  return eventos.filter((e) => canSeeTrazabilidadEvent(ctx, e));
}

export function filterNotificaciones(
  ctx: AccessContext,
  items: Notificacion[]
): Notificacion[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return items;
  const email = emailNorm(ctx.usuario.email);
  return items.filter((n) => {
    if (emailNorm(n.destinatarioEmail) === email) return true;
    if (n.contratoId && ctx.contratoIds.has(n.contratoId)) return true;
    return false;
  });
}

export function filterPagos(
  ctx: AccessContext,
  items: PagoReportado[]
): PagoReportado[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return items;
  return items.filter((p) => ctx.contratoIds.has(p.contratoId));
}

export function filterPagosServicio(
  ctx: AccessContext,
  items: PagoServicioPublico[]
): PagoServicioPublico[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return items;
  return items.filter((p) => ctx.contratoIds.has(p.contratoId));
}

export function filterMantenimiento(
  ctx: AccessContext,
  items: Mantenimiento[]
): Mantenimiento[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return items;
  return items.filter(
    (m) => ctx.inmuebleIds.has(m.inmuebleId) || m.solicitadoPorId === ctx.usuario.id
  );
}

export function filterNoRenovacion(
  ctx: AccessContext,
  items: NoRenovacion[]
): NoRenovacion[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return items;
  return items.filter((n) => ctx.contratoIds.has(n.contratoId));
}

export function filterByAccess<T>(
  ctx: AccessContext,
  items: T[],
  options: {
    getContratoId?: (item: T) => string | undefined;
    getInmuebleId?: (item: T) => string | undefined;
    allowPersonal?: (item: T) => boolean;
  }
): T[] {
  if (rolEfectivo(ctx.usuario) === "ADMIN") return items;
  return items.filter((item) => {
    const cId = options.getContratoId?.(item);
    if (cId && ctx.contratoIds.has(cId)) return true;
    const iId = options.getInmuebleId?.(item);
    if (iId && ctx.inmuebleIds.has(iId)) return true;
    if (options.allowPersonal?.(item)) return true;
    return false;
  });
}

async function registrarAccesoDenegado(
  recurso: string,
  recursoId: string
): Promise<void> {
  try {
    const { usuario } = await requireSession();
    const actor = auditActorFromUsuario(usuario);
    await getTrazabilidadRepository().create({
      entidadTipo: "USUARIO",
      entidadId: usuario.id,
      accion: "ACCESO_DENEGADO",
      descripcion: "Intento de acceso no autorizado",
      usuarioId: actor.usuarioId,
      usuarioNombre: actor.usuarioNombre,
      usuarioEmail: actor.usuarioEmail,
      usuarioRol: actor.usuarioRol,
      metadata: { recurso, recursoId },
    });
  } catch {
    /* no bloquear por fallo de auditoría */
  }
}

export async function assertAccessContrato(contratoId: string): Promise<AccessContext> {
  const ctx = await loadAccessContext();
  if (!canAccessContrato(ctx, contratoId)) {
    await registrarAccesoDenegado("CONTRATO", contratoId);
    throw new AuthError("No tiene permiso para acceder a este contrato", "FORBIDDEN");
  }
  return ctx;
}

export async function assertAccessInmueble(inmuebleId: string): Promise<AccessContext> {
  const ctx = await loadAccessContext();
  if (!canAccessInmueble(ctx, inmuebleId)) {
    await registrarAccesoDenegado("INMUEBLE", inmuebleId);
    throw new AuthError("No tiene permiso para acceder a este inmueble", "FORBIDDEN");
  }
  return ctx;
}

export async function canAccessEntidad(
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string
): Promise<boolean> {
  const ctx = await loadAccessContext();
  if (rolEfectivo(ctx.usuario) === "ADMIN") return true;

  switch (entidadTipo) {
    case "CONTRATO": {
      const c = await getContratosRepository().findById(entidadId);
      return c ? canAccessContrato(ctx, c.id) : false;
    }
    case "INMUEBLE": {
      return canAccessInmueble(ctx, entidadId);
    }
    case "PAGO": {
      const p = await getPagosRepository().findById(entidadId);
      return p ? ctx.contratoIds.has(p.contratoId) : false;
    }
    case "PAGO_SERVICIO_PUBLICO": {
      const p = await getPagosServicioRepository().findById(entidadId);
      return p ? ctx.contratoIds.has(p.contratoId) : false;
    }
    case "SERVICIO_PUBLICO": {
      const { getServiciosContratoRepository } = await import("@/repositories");
      const s = await getServiciosContratoRepository().findById(entidadId);
      return s ? ctx.contratoIds.has(s.contratoId) : false;
    }
    case "MANTENIMIENTO": {
      const m = await getMantenimientoRepository().findById(entidadId);
      return m ? ctx.inmuebleIds.has(m.inmuebleId) : false;
    }
    case "NO_RENOVACION": {
      const n = await getNoRenovacionRepository().findById(entidadId);
      return n ? ctx.contratoIds.has(n.contratoId) : false;
    }
    case "NOTIFICACION": {
      const n = await getNotificacionesRepository().findById(entidadId);
      if (!n) return false;
      return filterNotificaciones(ctx, [n]).length > 0;
    }
    case "USUARIO":
      return entidadId === ctx.usuario.id;
    default:
      return false;
  }
}

export async function assertAccessEntidad(
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string
): Promise<AccessContext> {
  const ok = await canAccessEntidad(entidadTipo, entidadId);
  if (!ok) {
    await registrarAccesoDenegado(entidadTipo, entidadId);
    throw new AuthError("No tiene permiso para acceder a este recurso", "FORBIDDEN");
  }
  return loadAccessContext();
}

export async function getNavAccessSummary() {
  const ctx = await loadAccessContext();
  const rol = rolEfectivo(ctx.usuario);
  const contratosConfirmados = ctx.contratos.filter((c) => c.estado === "CONFIRMADO");
  const arrendatarioSinVinculos =
    rol === "ARRENDATARIO" &&
    contratosConfirmados.length === 0 &&
    !ctx.tieneInvitacionesPendientes;

  return {
    arrendatarioSinVinculos,
    tieneContratosConfirmados: contratosConfirmados.length > 0,
    tieneInvitacionesPendientes: ctx.tieneInvitacionesPendientes,
  };
}
