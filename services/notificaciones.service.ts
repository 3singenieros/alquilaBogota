import { getAuditActor, SYSTEM_ACTOR } from "@/lib/audit/actor";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { inferirContextoTrazabilidad } from "@/lib/audit/context";
import { traceCambioEstado, traceEvento } from "@/lib/audit/trace-helper";
import { rolEfectivo } from "@/lib/auth/rol";
import { filterNotificaciones, loadAccessContext } from "@/services/access-control.service";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { getNotificacionesRepository } from "@/repositories";
import type { CreateInput, Notificacion, Rol } from "@/types";

function emailNorm(email: string): string {
  return email.trim().toLowerCase();
}

/** @deprecated Preferir filterNotificaciones con AccessContext en servicios nuevos */
export function filtroNotificacionesPorRol(
  items: Notificacion[],
  rol: Rol,
  usuarioEmail: string,
  contratoIds?: Set<string>
): Notificacion[] {
  if (rol === "ADMIN") return items;
  const email = emailNorm(usuarioEmail);
  return items.filter((n) => {
    if (emailNorm(n.destinatarioEmail) === email) return true;
    if (n.contratoId && contratoIds?.has(n.contratoId)) return true;
    return false;
  });
}

export async function listarNotificaciones() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "notificaciones");
  const ctx = await loadAccessContext(usuario);
  const items = await getNotificacionesRepository().findAll();
  return filterNotificaciones(
    ctx,
    items.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  );
}

type NotificacionInput = Omit<Notificacion, "id" | "estado" | "fechaCreacion"> &
  Partial<Pick<Notificacion, "estado" | "fechaCreacion" | "contratoId" | "fechaEnvioSimulado">>;

export async function registrarNotificacion(data: NotificacionInput) {
  const created = await getNotificacionesRepository().create({
    ...data,
    estado: data.estado ?? "PENDIENTE",
    fechaCreacion: data.fechaCreacion ?? new Date().toISOString().slice(0, 10),
  } as CreateInput<Notificacion>);

  const actor = (await getAuditActor()) ?? SYSTEM_ACTOR;
  const ctx = await inferirContextoTrazabilidad("NOTIFICACION", created.id, {
    contratoId: data.contratoId,
  });
  await traceEvento(actor, {
    entidadTipo: "NOTIFICACION",
    entidadId: created.id,
    accion: "NOTIFICACION_CREADA",
    descripcion: `${data.asunto} → ${data.destinatarioEmail}`,
    estadoNuevo: created.estado,
    contexto: ctx,
    metadata: { tipo: data.tipo },
  });

  return created;
}

export async function simularEnvioNotificacion(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "notificaciones");
  const existing = await getNotificacionesRepository().findById(id);
  const now = new Date().toISOString();
  const updated = await getNotificacionesRepository().update(id, {
    estado: "SIMULADA",
    fechaEnvioSimulado: now,
  });
  if (updated && existing) {
    const actor = auditActorFromUsuario(usuario);
    const ctx = await inferirContextoTrazabilidad("NOTIFICACION", id, {
      contratoId: existing.contratoId,
    });
    await traceCambioEstado(actor, {
      entidadTipo: "NOTIFICACION",
      entidadId: id,
      estadoAnterior: existing.estado,
      estadoNuevo: "SIMULADA",
      descripcion: `Envío simulado: ${existing.asunto}`,
      accionEspecifica: "NOTIFICACION_SIMULADA",
      contexto: ctx,
    });
  }
  return updated;
}

export async function crearNotificacionReajusteCanon(params: {
  contratoId: string;
  contratoCode: string;
  canonAnterior: number;
  canonActual: number;
  porcentaje: number;
  arrendador: { nombre: string; email: string };
  arrendatario: { nombre: string; email: string };
}) {
  const base = `Reajuste del ${params.porcentaje}% aplicado al contrato ${params.contratoCode}. Canon: ${params.canonAnterior} → ${params.canonActual}.`;
  await Promise.all([
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "REAJUSTE_CANON",
      destinatarioNombre: params.arrendador.nombre,
      destinatarioEmail: params.arrendador.email,
      rolDestinatario: "ARRENDADOR",
      asunto: `Reajuste de canon — ${params.contratoCode}`,
      mensaje: base,
      referenciaModulo: "Contratos",
    }),
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "REAJUSTE_CANON",
      destinatarioNombre: params.arrendatario.nombre,
      destinatarioEmail: params.arrendatario.email,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Reajuste de canon — ${params.contratoCode}`,
      mensaje: base,
      referenciaModulo: "Contratos",
    }),
  ]);
}

export async function crearNotificacionesNoRenovacion(params: {
  contratoId: string;
  solicitudCode: string;
  arrendadorEmail: string;
  arrendatarioEmail: string;
  arrendadorNombre: string;
  arrendatarioNombre: string;
}) {
  const mensaje = `Notificación simulada de no renovación (${params.solicitudCode}).`;
  await Promise.all([
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "NO_RENOVACION",
      destinatarioNombre: params.arrendadorNombre,
      destinatarioEmail: params.arrendadorEmail,
      rolDestinatario: "ARRENDADOR",
      asunto: `Aviso de no renovación — ${params.solicitudCode}`,
      mensaje,
      referenciaModulo: "No renovación",
    }),
    registrarNotificacion({
      contratoId: params.contratoId,
      tipo: "NO_RENOVACION",
      destinatarioNombre: params.arrendatarioNombre,
      destinatarioEmail: params.arrendatarioEmail,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Aviso de no renovación — ${params.solicitudCode}`,
      mensaje,
      referenciaModulo: "No renovación",
    }),
  ]);
}
