import { AuthError } from "@/lib/auth/errors";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { traceAdjuntosAgregados } from "@/lib/audit/trace-adjuntos";
import { traceCambioEstado, traceEvento } from "@/lib/audit/trace-helper";
import { combinarAdjuntos, metadataAdjuntosTrazabilidad } from "@/lib/archivos-adjuntos";
import { arrendadorPuedeGestionarEstado } from "@/lib/mantenimiento-reglas";
import {
  aceptacionInicial,
  calcularMontosCompartidos,
  validarCierreMantenimiento,
  validarDefinicionResponsabilidad,
  validarPorcentajesCompartidos,
} from "@/lib/mantenimiento-responsabilidad";
import { getMantenimientoRepository } from "@/repositories";
import { registrarNotificacion } from "@/services/notificaciones.service";
import {
  assertAccesoMantenimiento,
  contextoMantenimiento,
  resolverArrendador,
  resolverArrendatario,
} from "@/services/mantenimiento.service";
import type {
  AceptacionResponsabilidadMantenimiento,
  ArchivoAdjunto,
  Mantenimiento,
  TipoResponsabilidadMantenimiento,
} from "@/types";
import {
  accionCambioEstadoMantenimiento,
} from "@/lib/audit/trace-helper";

export async function definirResponsabilidadMantenimiento(
  id: string,
  input: {
    tipoResponsabilidad: TipoResponsabilidadMantenimiento;
    tipoMantenimiento?: Mantenimiento["tipoMantenimiento"];
    valorEstimado?: number;
    fechaEstimadaAtencion?: string;
    observacionesResponsabilidad?: string;
    porcentajeArrendador?: number;
    porcentajeArrendatario?: number;
  }
) {
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) throw new AuthError("Ticket no encontrado", "FORBIDDEN");

  const { usuario, rol } = await assertAccesoMantenimiento(existing);
  if (!arrendadorPuedeGestionarEstado(rol)) {
    throw new AuthError("No puedes definir la responsabilidad económica", "FORBIDDEN");
  }

  validarDefinicionResponsabilidad(input);

  const patch: Partial<Mantenimiento> = {
    tipoResponsabilidad: input.tipoResponsabilidad,
    tipoMantenimiento: input.tipoMantenimiento ?? existing.tipoMantenimiento ?? "CORRECTIVO",
    observacionesResponsabilidad: input.observacionesResponsabilidad?.trim(),
    fechaEstimadaAtencion: input.fechaEstimadaAtencion?.trim(),
    aceptacionArrendatario: aceptacionInicial(input.tipoResponsabilidad),
    motivoRechazoResponsabilidad: undefined,
  };

  if (input.tipoResponsabilidad === "ARRENDADOR" || input.tipoResponsabilidad === "COMPARTIDO") {
    patch.valorEstimado = input.valorEstimado;
  }

  if (input.tipoResponsabilidad === "COMPARTIDO") {
    validarPorcentajesCompartidos(
      input.porcentajeArrendador,
      input.porcentajeArrendatario
    );
    const montos = calcularMontosCompartidos(
      input.valorEstimado!,
      input.porcentajeArrendador!,
      input.porcentajeArrendatario!
    );
    patch.porcentajeArrendador = input.porcentajeArrendador;
    patch.porcentajeArrendatario = input.porcentajeArrendatario;
    patch.valorArrendador = montos.valorArrendador;
    patch.valorArrendatario = montos.valorArrendatario;
  }

  if (input.tipoResponsabilidad === "POR_DEFINIR" || input.tipoResponsabilidad === "ARRENDATARIO") {
    patch.valorEstimado = undefined;
    patch.valorFinal = undefined;
    patch.porcentajeArrendador = undefined;
    patch.porcentajeArrendatario = undefined;
    patch.valorArrendador = undefined;
    patch.valorArrendatario = undefined;
  }

  const updated = await getMantenimientoRepository().update(id, patch);
  if (!updated) return null;

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoMantenimiento(existing.inmuebleId);
  await traceEvento(actor, {
    entidadTipo: "MANTENIMIENTO",
    entidadId: id,
    accion: "MANTENIMIENTO_RESPONSABILIDAD_DEFINIDA",
    descripcion: `Responsabilidad definida: ${input.tipoResponsabilidad} (ticket ${updated.code})`,
    valoresAnteriores: { tipoResponsabilidad: existing.tipoResponsabilidad },
    valoresNuevos: {
      tipoResponsabilidad: input.tipoResponsabilidad,
      valorEstimado: patch.valorEstimado,
      porcentajeArrendador: patch.porcentajeArrendador,
      porcentajeArrendatario: patch.porcentajeArrendatario,
    },
    contexto: ctx,
  });

  if (patch.valorEstimado !== undefined) {
    await traceEvento(actor, {
      entidadTipo: "MANTENIMIENTO",
      entidadId: id,
      accion: "MANTENIMIENTO_VALOR_ESTIMADO_REGISTRADO",
      descripcion: `Valor estimado: $${patch.valorEstimado?.toLocaleString("es-CO")}`,
      valoresNuevos: { valorEstimado: patch.valorEstimado },
      contexto: ctx,
    });
  }

  if (input.tipoResponsabilidad === "COMPARTIDO") {
    const arrendatario = await resolverArrendatario(
      existing.solicitadoPorId,
      existing.inmuebleId
    );
    await registrarNotificacion({
      contratoId: ctx.contratoId,
      tipo: "MANTENIMIENTO_RESPONSABILIDAD_COMPARTIDA",
      destinatarioNombre: arrendatario.nombre,
      destinatarioEmail: arrendatario.email,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Distribución de costo — ticket ${updated.code}`,
      mensaje: `El arrendador propone reparto ${input.porcentajeArrendador}% / ${input.porcentajeArrendatario}% sobre $${input.valorEstimado?.toLocaleString("es-CO")}. Debes aceptar o rechazar.`,
      referenciaModulo: "Mantenimiento",
      estado: "PENDIENTE",
    });
  }

  return updated;
}

export async function responderResponsabilidadCompartida(
  id: string,
  input: {
    aceptar: boolean;
    motivoRechazoResponsabilidad?: string;
  }
) {
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) throw new AuthError("Ticket no encontrado", "FORBIDDEN");

  const { usuario, rol } = await assertAccesoMantenimiento(existing);
  if (rol !== "ARRENDATARIO" && rol !== "ADMIN") {
    throw new AuthError("Solo el arrendatario puede responder la distribución", "FORBIDDEN");
  }
  if (existing.tipoResponsabilidad !== "COMPARTIDO") {
    throw new AuthError("Este ticket no tiene responsabilidad compartida", "FORBIDDEN");
  }
  if (existing.aceptacionArrendatario !== "PENDIENTE") {
    throw new AuthError("La distribución ya fue respondida", "FORBIDDEN");
  }

  if (!input.aceptar && !input.motivoRechazoResponsabilidad?.trim()) {
    throw new AuthError("El motivo de rechazo es obligatorio", "FORBIDDEN");
  }

  const aceptacion: AceptacionResponsabilidadMantenimiento = input.aceptar
    ? "ACEPTADA"
    : "RECHAZADA";

  const updated = await getMantenimientoRepository().update(id, {
    aceptacionArrendatario: aceptacion,
    motivoRechazoResponsabilidad: input.aceptar
      ? undefined
      : input.motivoRechazoResponsabilidad?.trim(),
  });
  if (!updated) return null;

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoMantenimiento(existing.inmuebleId);
  const accion = input.aceptar
    ? "MANTENIMIENTO_RESPONSABILIDAD_ACEPTADA"
    : "MANTENIMIENTO_RESPONSABILIDAD_RECHAZADA";

  await traceEvento(actor, {
    entidadTipo: "MANTENIMIENTO",
    entidadId: id,
    accion,
    descripcion: input.aceptar
      ? `${usuario.nombre} aceptó la distribución compartida`
      : `${usuario.nombre} rechazó la distribución: ${input.motivoRechazoResponsabilidad}`,
    estadoAnterior: "PENDIENTE",
    estadoNuevo: aceptacion,
    contexto: ctx,
  });

  const arrendador = await resolverArrendador(existing.inmuebleId);
  await registrarNotificacion({
    contratoId: ctx.contratoId,
    tipo: input.aceptar
      ? "MANTENIMIENTO_RESPONSABILIDAD_ACEPTADA"
      : "MANTENIMIENTO_RESPONSABILIDAD_RECHAZADA",
    destinatarioNombre: arrendador.nombre,
    destinatarioEmail: arrendador.email,
    rolDestinatario: "ARRENDADOR",
    asunto: `Respuesta distribución — ${updated.code}`,
    mensaje: input.aceptar
      ? "El arrendatario aceptó la distribución de costos."
      : `Rechazó la distribución: ${input.motivoRechazoResponsabilidad}`,
    referenciaModulo: "Mantenimiento",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  return updated;
}

export async function cerrarMantenimientoTicket(
  id: string,
  input: {
    valorFinal?: number;
    fechaCierre: string;
    observacionesCierre?: string;
    documentosCierreAdjuntos?: ArchivoAdjunto[];
  }
) {
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) throw new AuthError("Ticket no encontrado", "FORBIDDEN");

  const { usuario, rol } = await assertAccesoMantenimiento(existing);
  if (!arrendadorPuedeGestionarEstado(rol)) {
    throw new AuthError("No puedes cerrar el ticket", "FORBIDDEN");
  }

  const docsCierre = input.documentosCierreAdjuntos ?? [];
  validarCierreMantenimiento(existing, {
    valorFinal: input.valorFinal,
    fechaCierre: input.fechaCierre,
    observacionesCierre: input.observacionesCierre,
    documentosCierreCount: docsCierre.length,
  });

  const documentosCierreAdjuntos = combinarAdjuntos(
    existing.documentosCierreAdjuntos,
    docsCierre
  );

  const patch: Partial<Mantenimiento> = {
    estado: "CERRADO",
    fechaCierre: input.fechaCierre,
    observacionesCierre: input.observacionesCierre?.trim(),
    documentosCierreAdjuntos,
  };

  const tipo = existing.tipoResponsabilidad ?? "POR_DEFINIR";
  if (tipo === "ARRENDADOR" || tipo === "COMPARTIDO") {
    patch.valorFinal = input.valorFinal;
  }

  const updated = await getMantenimientoRepository().update(id, patch);
  if (!updated) return null;

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoMantenimiento(existing.inmuebleId);

  if (input.valorFinal !== undefined) {
    await traceEvento(actor, {
      entidadTipo: "MANTENIMIENTO",
      entidadId: id,
      accion: "MANTENIMIENTO_VALOR_FINAL_REGISTRADO",
      descripcion: `Valor final registrado: $${input.valorFinal.toLocaleString("es-CO")}`,
      valoresNuevos: { valorFinal: input.valorFinal },
      contexto: ctx,
    });
  }

  if (docsCierre.length > 0) {
    await traceAdjuntosAgregados(actor, {
      entidadTipo: "MANTENIMIENTO",
      entidadId: id,
      adjuntos: docsCierre,
      accion: "MANTENIMIENTO_EVIDENCIA_ADJUNTADA",
      descripcion: `Se adjuntaron ${docsCierre.length} documento(s) de cierre`,
      contexto: ctx,
    });
  }

  await traceCambioEstado(actor, {
    entidadTipo: "MANTENIMIENTO",
    entidadId: id,
    estadoAnterior: existing.estado,
    estadoNuevo: "CERRADO",
    descripcion: `Ticket ${updated.code} cerrado`,
    accionEspecifica: accionCambioEstadoMantenimiento(existing.estado, "CERRADO"),
    contexto: ctx,
    metadata: metadataAdjuntosTrazabilidad(docsCierre, "MANTENIMIENTO", id),
  });

  const arrendatario = await resolverArrendatario(
    existing.solicitadoPorId,
    existing.inmuebleId
  );
  await registrarNotificacion({
    contratoId: ctx.contratoId,
    tipo: "MANTENIMIENTO_CERRADO",
    destinatarioNombre: arrendatario.nombre,
    destinatarioEmail: arrendatario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Ticket cerrado — ${updated.code}`,
    mensaje: `El ticket fue cerrado. ${input.observacionesCierre ?? ""}`.slice(0, 200),
    referenciaModulo: "Mantenimiento",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  return updated;
}
