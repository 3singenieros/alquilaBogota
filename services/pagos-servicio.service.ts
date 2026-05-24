import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { canAccessContrato, filterContratos, filterPagosServicio } from "@/lib/auth/scopes";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { contextoDesdeContrato } from "@/lib/audit/context";
import { traceCambioEstado } from "@/lib/audit/trace-helper";
import {
  descripcionPagoServicio,
  labelServicioContrato,
} from "@/lib/servicios-labels";
import {
  debeMarcarPagoVencido,
  fechaHoy,
  finMesPeriodo,
  puedeValidarORechazarPago,
} from "@/lib/servicios-estado";
import {
  getContratosRepository,
  getPagosServicioRepository,
  getServiciosContratoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { registrarNotificacion } from "@/services/notificaciones.service";
import type { CreateInput, PagoServicioPublico } from "@/types";
import { prepararComprobantes } from "@/lib/archivos-adjuntos";
import { traceAdjuntosAgregados } from "@/lib/audit/trace-adjuntos";
import { formatCurrency } from "@/lib/utils";
import type { ArchivoAdjunto } from "@/types";

function rolEfectivo(usuario: { rol: string; rolActivo?: string }) {
  return usuario.rolActivo ?? usuario.rol;
}

async function resolverArrendador(contrato: { arrendadorId: string }) {
  const usuarios = await getUsuariosRepository().findAll();
  const u = usuarios.find((x) => x.id === contrato.arrendadorId);
  return {
    nombre: u?.nombre ?? "Arrendador",
    email: u?.email ?? "",
  };
}

async function resolverArrendatario(contrato: {
  arrendatarioId: string;
  nombreArrendatario?: string;
  emailArrendatario: string;
}) {
  const usuarios = await getUsuariosRepository().findAll();
  const u = usuarios.find((x) => x.id === contrato.arrendatarioId);
  return {
    nombre: u?.nombre ?? contrato.nombreArrendatario ?? "Arrendatario",
    email: u?.email ?? contrato.emailArrendatario,
  };
}

async function sincronizarVencimientosPagos(items: PagoServicioPublico[]) {
  const hoy = fechaHoy();
  const repo = getPagosServicioRepository();
  const actor = {
    usuarioId: "system",
    usuarioNombre: "Sistema",
    usuarioEmail: "system@app.local",
    usuarioRol: "SISTEMA" as const,
  };

  for (const p of items) {
    if (!debeMarcarPagoVencido(p, hoy) || p.estado === "VENCIDO") continue;
    const anterior = p.estado;
    const updated = await repo.update(p.id, { estado: "VENCIDO" });
    if (!updated) continue;

    const servicio = await getServiciosContratoRepository().findById(
      p.servicioPublicoContratoId
    );
    const ctx = await contextoDesdeContrato(p.contratoId);
    await traceCambioEstado(actor, {
      entidadTipo: "PAGO_SERVICIO_PUBLICO",
      entidadId: p.id,
      estadoAnterior: anterior,
      estadoNuevo: "VENCIDO",
      descripcion: `Pago de servicio vencido (${p.periodo})${servicio ? ` — ${labelServicioContrato(servicio.tipoServicio, servicio.empresaPrestadora)}` : ""}.`,
      accionEspecifica: "PAGO_SERVICIO_VENCIDO",
      contexto: ctx,
    });

    const contrato = await getContratosRepository().findById(p.contratoId);
    if (contrato) {
      const arrendatario = await resolverArrendatario(contrato);
      await registrarNotificacion({
        contratoId: p.contratoId,
        tipo: "PAGO_SERVICIO_VENCIDO",
        destinatarioNombre: arrendatario.nombre,
        destinatarioEmail: arrendatario.email,
        rolDestinatario: "ARRENDATARIO",
        asunto: `Pago de servicio vencido — ${p.periodo}`,
        mensaje: `El pago del periodo ${p.periodo} venció el ${p.fechaVencimiento}. Reporta o actualiza el comprobante.`,
        referenciaModulo: "Servicios públicos",
        estado: "PENDIENTE",
      });
    }
    Object.assign(p, updated);
  }
}

export async function listarPagosServicio() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "servicios");
  const { contratos } = await loadAuthContext();
  const items = await getPagosServicioRepository().findAll();
  const scoped = filterPagosServicio(items, usuario, contratos);
  await sincronizarVencimientosPagos(scoped);
  return scoped;
}

export async function reportarPagoServicio(input: {
  servicioPublicoContratoId: string;
  periodo: string;
  fechaPago: string;
  valorPagado: number;
  comprobanteUrl?: string;
  comprobantesAdjuntos?: ArchivoAdjunto[];
  fechaVencimiento?: string;
  observaciones?: string;
}) {
  const { usuario } = await requireSession();
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDATARIO" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendatario puede reportar pagos de servicios", "FORBIDDEN");
  }

  const servicio = await getServiciosContratoRepository().findById(
    input.servicioPublicoContratoId
  );
  if (!servicio || !servicio.activo) {
    throw new AuthError("Servicio no disponible para reporte", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(servicio.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }
  if (contrato.estado !== "CONFIRMADO") {
    throw new AuthError("El contrato debe estar confirmado para reportar pagos", "FORBIDDEN");
  }

  const periodo = input.periodo.trim();
  const existentes = await getPagosServicioRepository().findByServicioContratoId(
    servicio.id
  );
  const duplicado = existentes.find(
    (p) =>
      p.periodo === periodo &&
      (p.estado === "REPORTADO" || p.estado === "VALIDADO" || p.estado === "VENCIDO")
  );
  if (duplicado && duplicado.estado !== "RECHAZADO") {
    throw new AuthError("Ya existe un pago reportado o validado para este periodo", "FORBIDDEN");
  }

  const hoy = fechaHoy();
  const { comprobantesAdjuntos, comprobanteUrl } = prepararComprobantes(
    input.comprobantesAdjuntos,
    input.comprobanteUrl
  );
  const payload: CreateInput<PagoServicioPublico> = {
    servicioPublicoContratoId: servicio.id,
    contratoId: servicio.contratoId,
    inmuebleId: servicio.inmuebleId,
    periodo,
    fechaPago: input.fechaPago,
    fechaReporte: hoy,
    fechaVencimiento: input.fechaVencimiento?.trim() || finMesPeriodo(periodo),
    valorPagado: input.valorPagado,
    estado: "REPORTADO",
    comprobanteUrl,
    comprobantesAdjuntos,
    reportadoPorId: usuario.id,
    observaciones: input.observaciones?.trim() || undefined,
  };

  const created = await getPagosServicioRepository().create(payload);
  const arrendador = await resolverArrendador(contrato);
  const desc = descripcionPagoServicio(
    servicio.tipoServicio,
    servicio.empresaPrestadora,
    periodo
  );

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "PAGO_SERVICIO_REPORTADO",
    destinatarioNombre: arrendador.nombre,
    destinatarioEmail: arrendador.email,
    rolDestinatario: "ARRENDADOR",
    asunto: `Pago de servicio reportado — ${periodo}`,
    mensaje: `El arrendatario reportó el pago del servicio ${desc} por ${formatCurrency(created.valorPagado)}.`,
    referenciaModulo: "Servicios públicos",
    estado: "PENDIENTE",
  });

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceCambioEstado(actor, {
    entidadTipo: "PAGO_SERVICIO_PUBLICO",
    entidadId: created.id,
    estadoAnterior: "PENDIENTE",
    estadoNuevo: "REPORTADO",
    descripcion: `El arrendatario reportó el pago del servicio ${desc}.`,
    accionEspecifica: "PAGO_SERVICIO_REPORTADO",
    contexto: ctx,
    metadata: { servicioPublicoContratoId: servicio.id },
  });

  if (comprobantesAdjuntos.length > 0) {
    await traceAdjuntosAgregados(actor, {
      entidadTipo: "PAGO_SERVICIO_PUBLICO",
      entidadId: created.id,
      adjuntos: comprobantesAdjuntos,
      descripcion: `Comprobantes del pago de servicio ${created.code}`,
      contexto: ctx,
    });
  }

  return created;
}

export async function validarPagoServicio(id: string, observaciones?: string) {
  const { usuario } = await requireSession();
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede validar pagos de servicios", "FORBIDDEN");
  }

  const pago = await getPagosServicioRepository().findById(id);
  if (!pago) throw new AuthError("Pago no encontrado", "FORBIDDEN");
  if (!puedeValidarORechazarPago(pago.estado)) {
    throw new AuthError("El pago no está pendiente de validación", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(pago.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }

  const servicio = await getServiciosContratoRepository().findById(
    pago.servicioPublicoContratoId
  );
  const anterior = pago.estado;
  const fechaValidacion = fechaHoy();

  const updated =
    (await getPagosServicioRepository().update(id, {
      estado: "VALIDADO",
      validadoPorId: usuario.id,
      fechaValidacion,
      observaciones: observaciones?.trim() || pago.observaciones,
    })) ?? pago;

  const arrendatario = await resolverArrendatario(contrato);
  const desc = servicio
    ? descripcionPagoServicio(servicio.tipoServicio, servicio.empresaPrestadora, pago.periodo)
    : pago.periodo;

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "PAGO_SERVICIO_VALIDADO",
    destinatarioNombre: arrendatario.nombre,
    destinatarioEmail: arrendatario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Pago de servicio validado — ${pago.periodo}`,
    mensaje: `El arrendador validó el pago del servicio ${desc}.`,
    referenciaModulo: "Servicios públicos",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceCambioEstado(actor, {
    entidadTipo: "PAGO_SERVICIO_PUBLICO",
    entidadId: id,
    estadoAnterior: anterior,
    estadoNuevo: "VALIDADO",
    descripcion: `El arrendador validó el pago del servicio ${desc}.`,
    accionEspecifica: "PAGO_SERVICIO_VALIDADO",
    contexto: ctx,
  });

  return updated;
}

export async function rechazarPagoServicio(id: string, motivoRechazo: string) {
  const { usuario } = await requireSession();
  const rol = rolEfectivo(usuario);
  if (rol !== "ARRENDADOR" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendador puede rechazar pagos de servicios", "FORBIDDEN");
  }

  const motivo = motivoRechazo.trim();
  if (!motivo) {
    throw new AuthError("El motivo de rechazo es obligatorio", "FORBIDDEN");
  }

  const pago = await getPagosServicioRepository().findById(id);
  if (!pago) throw new AuthError("Pago no encontrado", "FORBIDDEN");
  if (!puedeValidarORechazarPago(pago.estado)) {
    throw new AuthError("El pago no está pendiente de validación", "FORBIDDEN");
  }

  const contrato = await getContratosRepository().findById(pago.contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }

  const servicio = await getServiciosContratoRepository().findById(
    pago.servicioPublicoContratoId
  );
  const anterior = pago.estado;

  const updated =
    (await getPagosServicioRepository().update(id, {
      estado: "RECHAZADO",
      motivoRechazo: motivo,
      validadoPorId: undefined,
      fechaValidacion: undefined,
    })) ?? pago;

  const arrendatario = await resolverArrendatario(contrato);
  const desc = servicio
    ? descripcionPagoServicio(servicio.tipoServicio, servicio.empresaPrestadora, pago.periodo)
    : pago.periodo;

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "PAGO_SERVICIO_RECHAZADO",
    destinatarioNombre: arrendatario.nombre,
    destinatarioEmail: arrendatario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Pago de servicio rechazado — ${pago.periodo}`,
    mensaje: `El arrendador rechazó el pago del servicio ${desc}. Motivo: ${motivo}`,
    referenciaModulo: "Servicios públicos",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoDesdeContrato(contrato.id);
  await traceCambioEstado(actor, {
    entidadTipo: "PAGO_SERVICIO_PUBLICO",
    entidadId: id,
    estadoAnterior: anterior,
    estadoNuevo: "RECHAZADO",
    descripcion: `El arrendador rechazó el pago del servicio ${desc}. Motivo: ${motivo}`,
    accionEspecifica: "PAGO_SERVICIO_RECHAZADO",
    contexto: ctx,
    metadata: { motivoRechazo: motivo },
  });

  return updated;
}
