import { AuthError } from "@/lib/auth/errors";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  getContratosRepository,
  getInvitacionesContratoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { contextoDesdeContrato } from "@/lib/audit/context";
import {
  accionCambioEstadoContrato,
  traceCambioEstado,
} from "@/lib/audit/trace-helper";
import { registrarNotificacion } from "@/services/notificaciones.service";
import type { InvitacionContrato } from "@/types";

export async function listarInvitacionesPorEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const items = await getInvitacionesContratoRepository().findAll();
  return items.filter((i) => i.emailInvitado.toLowerCase() === normalized);
}

export async function contarInvitacionesPendientesPorEmail(email: string) {
  const items = await listarInvitacionesPorEmail(email);
  return items.filter((i) => i.estado === "PENDIENTE").length;
}

export async function listarSolicitudesContratoParaSesion() {
  const { usuario } = await requireSession();
  const roles = usuario.roles ?? [usuario.rol];
  if (!roles.includes("ARRENDATARIO") && usuario.rol !== "ADMIN") {
    throw new AuthError(
      "Necesitas el rol arrendatario para ver solicitudes de contrato",
      "FORBIDDEN"
    );
  }
  assertModuleAccess(usuario.rolActivo ?? usuario.rol, "solicitudes-contrato");
  return listarInvitacionesPorEmail(usuario.email);
}

export async function aceptarInvitacionContrato(invitationId: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "solicitudes-contrato");

  const invitacion = await getInvitacionesContratoRepository().findById(invitationId);
  if (!invitacion || invitacion.estado !== "PENDIENTE") {
    throw new AuthError("Invitación no disponible", "FORBIDDEN");
  }
  if (invitacion.emailInvitado.toLowerCase() !== usuario.email.toLowerCase()) {
    throw new AuthError("Esta invitación no es para tu cuenta", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(invitacion.contratoId);
  if (!contrato) {
    throw new AuthError("Contrato no encontrado", "FORBIDDEN");
  }

  const fechaRespuesta = new Date().toISOString();
  const updatedInv = await getInvitacionesContratoRepository().update(invitacion.id, {
    estado: "ACEPTADA",
    fechaRespuesta,
  });

  const updatedContrato = await getContratosRepository().update(contrato.id, {
    estado: "CONFIRMADO",
    arrendatarioId: usuario.id,
    emailArrendatario: usuario.email,
    nombreArrendatario: usuario.nombre,
  });

  const arrendador = (await getUsuariosRepository().findAll()).find(
    (u) => u.id === contrato.arrendadorId
  );

  await registrarNotificacion({
    tipo: "CONTRATO_ACEPTADO",
    contratoId: contrato.id,
    destinatarioNombre: arrendador?.nombre ?? "Arrendador",
    destinatarioEmail: arrendador?.email ?? "",
    rolDestinatario: "ARRENDADOR",
    asunto: `Contrato ${contrato.code} aceptado`,
    mensaje: `${usuario.nombre} aceptó el contrato del inmueble.`,
    referenciaModulo: "Solicitudes contrato",
  });

  await registrarNotificacion({
    tipo: "CONTRATO_ACEPTADO",
    contratoId: contrato.id,
    destinatarioNombre: usuario.nombre,
    destinatarioEmail: usuario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Contrato ${contrato.code} confirmado`,
    mensaje: "Tu arrendamiento quedó confirmado en el sistema.",
    referenciaModulo: "Mis contratos",
  });

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  if (updatedInv && updatedContrato) {
    await traceCambioEstado(actor, {
      entidadTipo: "INVITACION_CONTRATO",
      entidadId: invitacion.id,
      estadoAnterior: "PENDIENTE",
      estadoNuevo: "ACEPTADA",
      descripcion: `Invitación aceptada — contrato ${contrato.code} confirmado`,
      accionEspecifica: "CONTRATO_ACEPTADO",
      contexto: ctx,
    });
    await traceCambioEstado(actor, {
      entidadTipo: "CONTRATO",
      entidadId: contrato.id,
      estadoAnterior: contrato.estado,
      estadoNuevo: "CONFIRMADO",
      descripcion: `Contrato ${contrato.code} confirmado por ${usuario.nombre}`,
      accionEspecifica: accionCambioEstadoContrato(contrato.estado, "CONFIRMADO"),
      contexto: ctx,
    });
  }

  return { invitacion: updatedInv, contrato: updatedContrato };
}

export async function rechazarInvitacionContrato(
  invitationId: string,
  motivoRechazo: string
) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "solicitudes-contrato");

  if (!motivoRechazo.trim()) {
    throw new AuthError("El motivo de rechazo es obligatorio", "FORBIDDEN");
  }

  const invitacion = await getInvitacionesContratoRepository().findById(invitationId);
  if (!invitacion || invitacion.estado !== "PENDIENTE") {
    throw new AuthError("Invitación no disponible", "FORBIDDEN");
  }
  if (invitacion.emailInvitado.toLowerCase() !== usuario.email.toLowerCase()) {
    throw new AuthError("Esta invitación no es para tu cuenta", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(invitacion.contratoId);
  if (!contrato) {
    throw new AuthError("Contrato no encontrado", "FORBIDDEN");
  }

  const fechaRespuesta = new Date().toISOString();
  const updatedInv = await getInvitacionesContratoRepository().update(invitacion.id, {
    estado: "RECHAZADA",
    fechaRespuesta,
    motivoRechazo: motivoRechazo.trim(),
  });

  const updatedContrato = await getContratosRepository().update(contrato.id, {
    estado: "RECHAZADO",
    motivoRechazo: motivoRechazo.trim(),
  });

  const arrendador = (await getUsuariosRepository().findAll()).find(
    (u) => u.id === contrato.arrendadorId
  );

  if (arrendador) {
    await registrarNotificacion({
      tipo: "CONTRATO_RECHAZADO",
      contratoId: contrato.id,
      destinatarioNombre: arrendador.nombre,
      destinatarioEmail: arrendador.email,
      rolDestinatario: "ARRENDADOR",
      asunto: `Contrato ${contrato.code} rechazado`,
      mensaje: `${usuario.nombre} rechazó el contrato. Motivo: ${motivoRechazo.trim()}`,
      referenciaModulo: "Contratos",
    });
  }

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  if (updatedInv && updatedContrato) {
    await traceCambioEstado(actor, {
      entidadTipo: "INVITACION_CONTRATO",
      entidadId: invitacion.id,
      estadoAnterior: "PENDIENTE",
      estadoNuevo: "RECHAZADA",
      descripcion: `Invitación rechazada: ${motivoRechazo.trim()}`,
      accionEspecifica: "CONTRATO_RECHAZADO",
      contexto: ctx,
      metadata: { motivoRechazo: motivoRechazo.trim() },
    });
    await traceCambioEstado(actor, {
      entidadTipo: "CONTRATO",
      entidadId: contrato.id,
      estadoAnterior: contrato.estado,
      estadoNuevo: "RECHAZADO",
      descripcion: `Contrato ${contrato.code} rechazado`,
      accionEspecifica: accionCambioEstadoContrato(contrato.estado, "RECHAZADO"),
      contexto: ctx,
    });
  }

  return { invitacion: updatedInv, contrato: updatedContrato };
}
