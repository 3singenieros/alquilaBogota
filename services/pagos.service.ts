import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { canAccessContrato, filterPagos } from "@/lib/auth/scopes";
import {
  getContratosRepository,
  getPagosRepository,
  getSoportePagoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { sendPaymentSupportEmail } from "@/services/email.service";
import { registrarNotificacion } from "@/services/notificaciones.service";
import type { CreateInput, PagoReportado, UpdateInput } from "@/types";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { contextoDesdeContrato } from "@/lib/audit/context";
import {
  accionCambioEstadoPago,
  traceCambioEstado,
  traceEvento,
} from "@/lib/audit/trace-helper";
import { prepararComprobantes } from "@/lib/archivos-adjuntos";
import { traceAdjuntosAgregados } from "@/lib/audit/trace-adjuntos";
import { formatCurrency } from "@/lib/utils";

async function assertPagoAccess(contratoId: string) {
  const { usuario } = await requireSession();
  const contrato = await getContratosRepository().findById(contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido para este usuario", "FORBIDDEN");
  }
  return { usuario, contrato };
}

function rolEfectivo(usuario: { rol: string; rolActivo?: string }) {
  return usuario.rolActivo ?? usuario.rol;
}

async function resolverArrendatario(contrato: {
  arrendatarioId: string;
  nombreArrendatario?: string;
  emailArrendatario: string;
}) {
  const usuarios = await getUsuariosRepository().findAll();
  const u = usuarios.find((x) => x.id === contrato.arrendatarioId);
  return {
    id: contrato.arrendatarioId || u?.id || "",
    nombre: u?.nombre ?? contrato.nombreArrendatario ?? "Arrendatario",
    email: u?.email ?? contrato.emailArrendatario,
  };
}

async function resolverArrendador(arrendadorId: string) {
  const usuarios = await getUsuariosRepository().findAll();
  const u = usuarios.find((x) => x.id === arrendadorId);
  return {
    id: arrendadorId,
    nombre: u?.nombre ?? "Arrendador",
    email: u?.email ?? "",
  };
}

export async function listarPagos() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");
  const { contratos } = await loadAuthContext();
  const items = await getPagosRepository().findAll();
  return filterPagos(items, usuario, contratos);
}

export async function crearPago(data: CreateInput<PagoReportado>) {
  const { usuario, contrato } = await assertPagoAccess(data.contratoId);
  assertModuleAccess(usuario.rol, "pagos");

  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDATARIO" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendatario puede reportar pagos", "FORBIDDEN");
  }

  const { comprobantesAdjuntos, comprobanteUrl } = prepararComprobantes(
    data.comprobantesAdjuntos,
    data.comprobanteUrl
  );
  const payload: CreateInput<PagoReportado> = {
    ...data,
    reportadoPorId: usuario.id,
    estado: "REPORTADO",
    comprobantesAdjuntos,
    comprobanteUrl,
  };

  const created = await getPagosRepository().create(payload);
  const arrendador = await resolverArrendador(contrato.arrendadorId);

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "PAGO_REPORTADO",
    destinatarioNombre: arrendador.nombre,
    destinatarioEmail: arrendador.email,
    rolDestinatario: "ARRENDADOR",
    asunto: `Nuevo pago reportado — ${created.mes}`,
    mensaje: `El arrendatario reportó el pago ${created.code} por ${formatCurrency(created.monto)} (${created.mes}). Pendiente de validación.`,
    referenciaModulo: "Pagos",
    estado: "PENDIENTE",
  });

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceEvento(actor, {
    entidadTipo: "PAGO",
    entidadId: created.id,
    accion: "PAGO_REPORTADO",
    descripcion: `Pago ${created.code} reportado (${created.mes})`,
    estadoNuevo: "REPORTADO",
    contexto: { ...ctx, pagoId: created.id },
    valoresNuevos: { monto: created.monto, mes: created.mes },
  });

  if (comprobantesAdjuntos.length > 0) {
    await traceAdjuntosAgregados(actor, {
      entidadTipo: "PAGO",
      entidadId: created.id,
      adjuntos: comprobantesAdjuntos,
      descripcion: `Comprobantes del pago ${created.code}`,
      contexto: { ...ctx, pagoId: created.id },
    });
  }

  return created;
}

export async function validarPago(pagoId: string, observaciones?: string) {
  const { usuario } = await requireSession();
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede validar pagos", "FORBIDDEN");
  }

  const pago = await getPagosRepository().findById(pagoId);
  if (!pago) {
    throw new AuthError("Pago no encontrado", "FORBIDDEN");
  }
  if (pago.estado !== "REPORTADO") {
    throw new AuthError("Solo se pueden validar pagos en estado REPORTADO", "FORBIDDEN");
  }

  const { contrato } = await assertPagoAccess(pago.contratoId);
  const arrendatario = await resolverArrendatario(contrato);
  const fechaValidacion = new Date().toISOString().slice(0, 10);

  const soporte = await getSoportePagoRepository().create({
    pagoId: pago.id,
    contratoId: contrato.id,
    arrendadorId: contrato.arrendadorId,
    arrendatarioId: arrendatario.id || pago.reportadoPorId,
    fechaGeneracion: fechaValidacion,
    monto: pago.monto,
    periodo: pago.mes,
    medioPago: pago.medioPago,
    observaciones: observaciones?.trim() || undefined,
    estadoEnvioEmail: "PENDIENTE",
  });

  const emailResult = await sendPaymentSupportEmail({
    destinatarioEmail: arrendatario.email,
    destinatarioNombre: arrendatario.nombre,
    numeroSoporte: soporte.numeroSoporte,
    monto: pago.monto,
    periodo: pago.mes,
    contratoCode: contrato.code,
  });

  if (emailResult.success) {
    await getSoportePagoRepository().update(soporte.id, {
      estadoEnvioEmail: "SIMULADO" as const,
    });
  }

  const updated =
    (await getPagosRepository().update(pago.id, {
      estado: "VALIDADO",
      fechaValidacion,
      validadoPorId: usuario.id,
      soportePagoId: soporte.id,
    })) ?? pago;

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "PAGO_VALIDADO",
    destinatarioNombre: arrendatario.nombre,
    destinatarioEmail: arrendatario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Pago validado — ${pago.mes}`,
    mensaje: `Tu pago ${pago.code} por ${formatCurrency(pago.monto)} fue validado. Soporte ${soporte.numeroSoporte} disponible para descarga.`,
    referenciaModulo: "Pagos",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  const soporteFinal =
    (await getSoportePagoRepository().findById(soporte.id)) ?? soporte;

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceCambioEstado(actor, {
    entidadTipo: "PAGO",
    entidadId: pago.id,
    estadoAnterior: "REPORTADO",
    estadoNuevo: "VALIDADO",
    descripcion: `Pago ${pago.code} validado — soporte ${soporte.numeroSoporte}`,
    accionEspecifica: accionCambioEstadoPago("REPORTADO", "VALIDADO"),
    contexto: { ...ctx, pagoId: pago.id },
  });
  await traceEvento(actor, {
    entidadTipo: "SOPORTE_PAGO",
    entidadId: soporteFinal.id,
    accion: "SOPORTE_GENERADO",
    descripcion: `Soporte ${soporteFinal.numeroSoporte} generado`,
    contexto: { ...ctx, pagoId: pago.id },
    metadata: { numeroSoporte: soporteFinal.numeroSoporte },
  });

  return { pago: updated, soporte: soporteFinal };
}

export async function rechazarPago(pagoId: string, motivoRechazo: string) {
  const { usuario } = await requireSession();
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede rechazar pagos", "FORBIDDEN");
  }

  const motivo = motivoRechazo.trim();
  if (!motivo) {
    throw new AuthError("El motivo de rechazo es obligatorio", "FORBIDDEN");
  }

  const pago = await getPagosRepository().findById(pagoId);
  if (!pago) {
    throw new AuthError("Pago no encontrado", "FORBIDDEN");
  }
  if (pago.estado !== "REPORTADO") {
    throw new AuthError("Solo se pueden rechazar pagos en estado REPORTADO", "FORBIDDEN");
  }

  const { contrato } = await assertPagoAccess(pago.contratoId);
  const arrendatario = await resolverArrendatario(contrato);

  const updated =
    (await getPagosRepository().update(pago.id, {
      estado: "RECHAZADO",
      rechazadoPorId: usuario.id,
      motivoRechazo: motivo,
    })) ?? pago;

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "PAGO_RECHAZADO",
    destinatarioNombre: arrendatario.nombre,
    destinatarioEmail: arrendatario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Pago rechazado — ${pago.mes}`,
    mensaje: `Tu pago ${pago.code} fue rechazado. Motivo: ${motivo}`,
    referenciaModulo: "Pagos",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceCambioEstado(actor, {
    entidadTipo: "PAGO",
    entidadId: pago.id,
    estadoAnterior: "REPORTADO",
    estadoNuevo: "RECHAZADO",
    descripcion: `Pago ${pago.code} rechazado: ${motivo}`,
    accionEspecifica: accionCambioEstadoPago("REPORTADO", "RECHAZADO"),
    contexto: { ...ctx, pagoId: pago.id },
    metadata: { motivoRechazo: motivo },
  });

  return updated;
}

export async function actualizarPago(id: string, data: UpdateInput<PagoReportado>) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");

  const pago = await getPagosRepository().findById(id);
  if (!pago) {
    throw new AuthError("Pago no encontrado", "FORBIDDEN");
  }
  await assertPagoAccess(pago.contratoId);

  if (rolEfectivo(usuario) === "ARRENDATARIO") {
    throw new AuthError("El arrendatario no puede modificar pagos", "FORBIDDEN");
  }

  return getPagosRepository().update(id, data);
}

export async function eliminarPago(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "pagos");
  if (usuario.rol !== "ADMIN") {
    throw new AuthError("Solo administración puede eliminar pagos", "FORBIDDEN");
  }
  const pago = await getPagosRepository().findById(id);
  if (!pago) return false;
  await assertPagoAccess(pago.contratoId);
  return getPagosRepository().delete(id);
}
