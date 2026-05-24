import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import {
  canAccessContrato,
  filterNoRenovacion,
} from "@/lib/auth/scopes";
import {
  getContratosRepository,
  getNoRenovacionRepository,
  getUsuariosRepository,
} from "@/repositories";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { contextoDesdeContrato } from "@/lib/audit/context";
import {
  traceActualizacion,
  traceCreado,
  traceCambioEstado,
} from "@/lib/audit/trace-helper";
import {
  crearNotificacionesNoRenovacion,
} from "@/services/notificaciones.service";
import { prepararDocumentosContrato } from "@/lib/archivos-adjuntos";
import { traceAdjuntosAgregados } from "@/lib/audit/trace-adjuntos";
import type { CreateInput, NoRenovacion, UpdateInput } from "@/types";

export async function listarNoRenovacion() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");
  const { contratos } = await loadAuthContext();
  const items = await getNoRenovacionRepository().findAll();
  return filterNoRenovacion(items, usuario, contratos);
}

export async function crearNoRenovacion(data: CreateInput<NoRenovacion>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");

  const contrato = await getContratosRepository().findById(data.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }

  const usuarios = await getUsuariosRepository().findAll();
  const arrendador = usuarios.find((u) => u.id === contrato.arrendadorId);
  const arrendatario = usuarios.find((u) => u.id === contrato.arrendatarioId);

  if (usuario.rol === "ARRENDATARIO") {
    data = {
      ...data,
      solicitadoPorId: usuario.id,
      estado: "SOLICITADA",
    };
  }

  const docs = prepararDocumentosContrato(data.documentosAdjuntos, data.documentoUrl);
  const created = await getNoRenovacionRepository().create({
    ...data,
    documentosAdjuntos: docs.documentosAdjuntos,
    documentoUrl: docs.documentoUrl,
    fechaLimitePreaviso: data.fechaLimitePreaviso || contrato.fechaLimitePreaviso,
    destinatarioArrendadorEmail:
      data.destinatarioArrendadorEmail || arrendador?.email || "",
    destinatarioArrendatarioEmail:
      data.destinatarioArrendatarioEmail || arrendatario?.email || "",
    estadoNotificacion: data.estadoNotificacion ?? "PENDIENTE",
  });
  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceCreado(
    actor,
    "NO_RENOVACION",
    created.id,
    `Solicitud de no renovación ${created.code}`,
    ctx,
    "NO_RENOVACION_SOLICITADA"
  );
  if (docs.documentosAdjuntos.length > 0) {
    await traceAdjuntosAgregados(actor, {
      entidadTipo: "NO_RENOVACION",
      entidadId: created.id,
      adjuntos: docs.documentosAdjuntos,
      descripcion: `Documentos de no renovación ${created.code}`,
      contexto: ctx,
    });
  }
  return created;
}

export async function actualizarNoRenovacion(
  id: string,
  data: UpdateInput<NoRenovacion>
) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");

  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Solicitud no encontrada", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(existing.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Sin permiso sobre esta solicitud", "FORBIDDEN");
  }

  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("El arrendatario no puede cambiar el estado de la solicitud", "FORBIDDEN");
  }

  const updated = await getNoRenovacionRepository().update(id, data);
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    const ctx = await contextoDesdeContrato(existing.contratoId);
    await traceActualizacion(actor, "NO_RENOVACION", id, existing, updated, {
      descripcion: `No renovación ${updated.code} actualizada`,
      estadoField: "estado",
      contexto: ctx,
    });
  }
  return updated;
}

export async function eliminarNoRenovacion(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");
  if (usuario.rol !== "ADMIN") {
    throw new AuthError("Solo administración puede eliminar solicitudes", "FORBIDDEN");
  }
  return getNoRenovacionRepository().delete(id);
}

export async function simularEnvioNotificacionNoRenovacion(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");

  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Solicitud no encontrada", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(existing.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Sin permiso sobre esta solicitud", "FORBIDDEN");
  }

  if (usuario.rol === "ARRENDATARIO") {
    throw new AuthError("El arrendatario no puede simular el envío", "FORBIDDEN");
  }

  const now = new Date().toISOString();
  const usuarios = await getUsuariosRepository().findAll();
  const arrendador = usuarios.find((u) => u.email === existing.destinatarioArrendadorEmail);
  const arrendatario = usuarios.find(
    (u) => u.email === existing.destinatarioArrendatarioEmail
  );

  await crearNotificacionesNoRenovacion({
    contratoId: existing.contratoId,
    solicitudCode: existing.code,
    arrendadorEmail: existing.destinatarioArrendadorEmail,
    arrendatarioEmail: existing.destinatarioArrendatarioEmail,
    arrendadorNombre: arrendador?.nombre ?? "Arrendador",
    arrendatarioNombre: arrendatario?.nombre ?? "Arrendatario",
  });

  const updated = await getNoRenovacionRepository().update(id, {
    estadoNotificacion: "SIMULADA",
    fechaEnvioNotificacion: now,
    observacionesNotificacion:
      existing.observacionesNotificacion ??
      "Envío simulado registrado en historial de notificaciones.",
  });
  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(existing.contratoId);
  await traceCambioEstado(actor, {
    entidadTipo: "NO_RENOVACION",
    entidadId: id,
    estadoAnterior: existing.estadoNotificacion,
    estadoNuevo: "SIMULADA",
    descripcion: `Notificación de no renovación ${existing.code} simulada`,
    accionEspecifica: "NO_RENOVACION_NOTIFICADA",
    contexto: ctx,
  });
  return updated;
}
