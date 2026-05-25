import { AuthError } from "@/lib/auth/errors";
import {
  formatInmuebleDireccionCompleta,
  formatInmuebleUbicacion,
} from "@/lib/inmueble-ubicacion";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { canAccessContrato, filterContratos, filterNoRenovacion } from "@/lib/auth/scopes";
import {
  datosFormalesDesdeContrato,
  estaDentroPlazoPreaviso,
  rolEsParteContrato,
} from "@/lib/contrato-datos-formales";
import {
  construirCamposPartes,
  inferirManifestante,
  rolManifestanteDesdeUsuario,
  textoComunicacionDesdeExpediente,
  type RolManifestante,
} from "@/lib/no-renovacion-build";
import { auditActorFromUsuario } from "@/lib/audit/actor";
import { contextoDesdeContrato } from "@/lib/audit/context";
import { traceAdjuntosAgregados } from "@/lib/audit/trace-adjuntos";
import { traceActualizacion, traceCambioEstado, traceEvento } from "@/lib/audit/trace-helper";
import { debeRegistrarTrazabilidadAdjuntos, prepararDocumentosContrato } from "@/lib/archivos-adjuntos";
import {
  getContratosRepository,
  getInmueblesRepository,
  getNoRenovacionRepository,
  getUsuariosRepository,
} from "@/repositories";
import { registrarNotificacion } from "@/services/notificaciones.service";
import type {
  ArchivoAdjunto,
  Contrato,
  CreateInput,
  Inmueble,
  MedioEnvioNoRenovacion,
  NoRenovacion,
  OrigenNoRenovacion,
  UpdateInput,
} from "@/types";
import type { NoRenovacionPdfData } from "@/types/no-renovacion-pdf";

export type ExpedienteContexto = {
  contrato: Contrato;
  inmueble: Inmueble;
  datosFormales: ReturnType<typeof datosFormalesDesdeContrato>;
  dentroDelPlazoPreaviso: boolean;
  puedeIniciar: boolean;
};

export type RegistrarEnvioNoRenovacionInput = {
  medioEnvio: MedioEnvioNoRenovacion;
  empresaMensajeria?: string;
  numeroGuiaCorreoCertificado?: string;
  fechaEnvioRegistrado: string;
  evidenciaEnvioAdjuntos?: ArchivoAdjunto[];
};

export type ActualizarDatosFormalesContratoInput = Partial<
  Pick<
    Contrato,
    | "nombreArrendador"
    | "tipoDocumentoArrendador"
    | "numeroDocumentoArrendador"
    | "correoNotificacionesArrendador"
    | "direccionNotificacionesArrendador"
    | "nombreArrendatario"
    | "tipoDocumentoArrendatario"
    | "numeroDocumentoArrendatario"
    | "correoNotificacionesArrendatario"
    | "direccionNotificacionesArrendatario"
  >
>;

async function cargarContratoInmueble(contratoId: string) {
  const contrato = await getContratosRepository().findById(contratoId);
  if (!contrato) return null;
  const inmueble = await getInmueblesRepository().findById(contrato.inmuebleId);
  if (!inmueble) return null;
  return { contrato, inmueble };
}

async function assertAccesoExpediente(expediente: NoRenovacion) {
  const { usuario } = await requireSession();
  const par = await cargarContratoInmueble(expediente.contratoId);
  if (!par || !canAccessContrato(par.contrato, usuario)) {
    throw new AuthError("Sin permiso sobre este expediente", "FORBIDDEN");
  }
  return { usuario, ...par };
}

function metadataExpediente(nr: NoRenovacion): Record<string, unknown> {
  return {
    medioEnvio: nr.medioEnvio,
    numeroGuia: nr.numeroGuiaCorreoCertificado,
    destinatarioEmail: nr.destinatarioEmail,
    remitenteEmail: nr.remitenteEmail,
    dentroDelPlazoPreaviso: nr.dentroDelPlazoPreaviso,
  };
}

export async function listarNoRenovacion() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");
  const { contratos } = await loadAuthContext();
  const items = await getNoRenovacionRepository().findAll();
  return filterNoRenovacion(items, usuario, contratos);
}

export async function listarContratosElegiblesNoRenovacion() {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");
  const { contratos } = await loadAuthContext();
  return filterContratos(contratos, usuario).filter((c) => c.estado === "CONFIRMADO");
}

export async function obtenerContextoExpediente(
  contratoId: string
): Promise<ExpedienteContexto> {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");

  const par = await cargarContratoInmueble(contratoId);
  if (!par) {
    throw new AuthError("Contrato no encontrado", "FORBIDDEN");
  }
  const { contrato, inmueble } = par;
  if (!canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }
  if (contrato.estado !== "CONFIRMADO") {
    throw new AuthError("Solo contratos confirmados pueden usar no renovación", "FORBIDDEN");
  }

  const usuarios = await getUsuariosRepository().findAll();
  const arrendador = usuarios.find((u) => u.id === contrato.arrendadorId);
  const arrendatario = usuarios.find((u) => u.id === contrato.arrendatarioId);
  const datosFormales = datosFormalesDesdeContrato(
    contrato,
    inmueble,
    arrendador,
    arrendatario
  );
  const dentro = estaDentroPlazoPreaviso(contrato.fechaLimitePreaviso);

  return {
    contrato,
    inmueble,
    datosFormales,
    dentroDelPlazoPreaviso: dentro,
    puedeIniciar: rolEsParteContrato(usuario.rol, contrato, usuario.id),
  };
}

export async function crearExpedienteNoRenovacion(
  contratoId: string,
  manifestanteOverride?: RolManifestante
) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");

  const ctx = await obtenerContextoExpediente(contratoId);
  if (!ctx.puedeIniciar && usuario.rol !== "ADMIN") {
    throw new AuthError("No puede iniciar no renovación en este contrato", "FORBIDDEN");
  }

  const manifestante = rolManifestanteDesdeUsuario(usuario, manifestanteOverride);
  const partes = construirCamposPartes(manifestante, ctx.datosFormales);
  const dentro = estaDentroPlazoPreaviso(ctx.contrato.fechaLimitePreaviso);
  const now = new Date().toISOString();

  const payload: CreateInput<NoRenovacion> = {
    contratoId,
    inmuebleId: ctx.inmueble.id,
    iniciadoPorId: usuario.id,
    iniciadoPorNombre: usuario.nombre,
    iniciadoPorEmail: usuario.email,
    iniciadoPorRol: usuario.rol === "ADMIN" ? manifestante : usuario.rol,
    ...partes,
    fechaCreacion: now.slice(0, 10),
    fechaFinContrato: ctx.contrato.fechaFin,
    fechaLimitePreaviso: ctx.contrato.fechaLimitePreaviso,
    dentroDelPlazoPreaviso: dentro,
    estado: "BORRADOR",
    estadoEnvio: "PENDIENTE",
  };

  const created = await getNoRenovacionRepository().create(payload);
  const actor = auditActorFromUsuario(usuario);
  const auditCtx = await contextoDesdeContrato(contratoId);
  await traceEvento(actor, {
    entidadTipo: "NO_RENOVACION",
    entidadId: created.id,
    accion: "NO_RENOVACION_CREADA",
    descripcion: `Expediente de no renovación ${created.code} creado`,
    estadoNuevo: created.estado,
    contexto: auditCtx,
    metadata: metadataExpediente(created),
  });
  return created;
}

export async function obtenerExpedienteNoRenovacion(id: string) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  await assertAccesoExpediente(existing);
  const ctx = await obtenerContextoExpediente(existing.contratoId);
  return { expediente: existing, ...ctx };
}

export async function actualizarExpedienteNoRenovacion(
  id: string,
  data: UpdateInput<NoRenovacion>
) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  const { usuario } = await assertAccesoExpediente(existing);

  if (existing.estado === "ENVIO_REGISTRADO" || existing.estado === "ANULADA") {
    throw new AuthError("El expediente no admite cambios en este estado", "FORBIDDEN");
  }

  if (
    usuario.rol !== "ADMIN" &&
    existing.iniciadoPorId !== usuario.id &&
    existing.estado === "BORRADOR"
  ) {
    // La otra parte puede consultar pero no editar borrador ajeno
    const par = await cargarContratoInmueble(existing.contratoId);
    if (par && !canAccessContrato(par.contrato, usuario)) {
      throw new AuthError("Sin permiso para editar", "FORBIDDEN");
    }
    if (existing.iniciadoPorId !== usuario.id) {
      throw new AuthError("Solo quien inició puede editar el borrador", "FORBIDDEN");
    }
  }

  const updated = await getNoRenovacionRepository().update(id, data);
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    const auditCtx = await contextoDesdeContrato(existing.contratoId);
    await traceActualizacion(actor, "NO_RENOVACION", id, existing, updated, {
      descripcion: `Expediente ${updated.code} actualizado`,
      estadoField: "estado",
      contexto: auditCtx,
    });
  }
  return updated;
}

export async function actualizarDatosFormalesContrato(
  contratoId: string,
  datos: ActualizarDatosFormalesContratoInput
) {
  const { usuario } = await requireSession();
  const contrato = await getContratosRepository().findById(contratoId);
  if (!contrato || !canAccessContrato(contrato, usuario)) {
    throw new AuthError("Contrato no permitido", "FORBIDDEN");
  }
  return getContratosRepository().update(contratoId, datos);
}

export async function sincronizarPartesExpediente(id: string) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  await assertAccesoExpediente(existing);
  const ctx = await obtenerContextoExpediente(existing.contratoId);
  const manifestante = inferirManifestante(existing);
  const partes = construirCamposPartes(manifestante, ctx.datosFormales);
  return getNoRenovacionRepository().update(id, {
    ...partes,
    dentroDelPlazoPreaviso: estaDentroPlazoPreaviso(ctx.contrato.fechaLimitePreaviso),
  });
}

export async function generarComunicacionNoRenovacion(id: string) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  const { usuario, contrato, inmueble } = await assertAccesoExpediente(existing);

  if (existing.iniciadoPorId !== usuario.id && usuario.rol !== "ADMIN") {
    throw new AuthError("Solo quien inició puede generar la comunicación", "FORBIDDEN");
  }

  const cuerpo = textoComunicacionDesdeExpediente(existing, contrato, inmueble);
  const now = new Date().toISOString();
  const updated = await getNoRenovacionRepository().update(id, {
    cuerpoComunicacionGenerado: cuerpo,
    estado: "DOCUMENTO_GENERADO",
    fechaGeneracionDocumento: now,
  });

  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    const auditCtx = await contextoDesdeContrato(existing.contratoId);
    await traceEvento(actor, {
      entidadTipo: "NO_RENOVACION",
      entidadId: id,
      accion: "NO_RENOVACION_DOCUMENTO_GENERADO",
      descripcion: `Comunicación formal generada — ${updated.code}`,
      estadoAnterior: existing.estado,
      estadoNuevo: updated.estado,
      contexto: auditCtx,
      metadata: metadataExpediente(updated),
    });
  }
  return updated;
}

export async function registrarDescargaPdfNoRenovacion(id: string) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  const { usuario } = await assertAccesoExpediente(existing);

  const actor = auditActorFromUsuario(usuario);
  const auditCtx = await contextoDesdeContrato(existing.contratoId);
  await traceEvento(actor, {
    entidadTipo: "NO_RENOVACION",
    entidadId: id,
    accion: "NO_RENOVACION_PDF_DESCARGADO",
    descripcion: `PDF de no renovación descargado — ${existing.code}`,
    contexto: auditCtx,
    metadata: metadataExpediente(existing),
  });
}

export async function obtenerDatosPdfNoRenovacion(id: string): Promise<NoRenovacionPdfData> {
  const { expediente, contrato, inmueble } = await obtenerExpedienteNoRenovacion(id);
  if (!expediente.cuerpoComunicacionGenerado) {
    throw new AuthError("Genere la comunicación antes de descargar el PDF", "FORBIDDEN");
  }
  return {
    expediente,
    ciudad: formatInmuebleUbicacion(inmueble),
    inmuebleDireccion: formatInmuebleDireccionCompleta(inmueble),
    codigoContrato: contrato.code,
  };
}

export async function registrarEnvioNoRenovacion(
  id: string,
  input: RegistrarEnvioNoRenovacionInput
) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  const { usuario, contrato, inmueble } = await assertAccesoExpediente(existing);

  if (existing.estado === "ENVIO_REGISTRADO") {
    throw new AuthError("El envío ya fue registrado", "FORBIDDEN");
  }
  if (existing.estado !== "DOCUMENTO_GENERADO") {
    throw new AuthError("Genere el documento antes de registrar el envío", "FORBIDDEN");
  }

  if (existing.iniciadoPorId !== usuario.id && usuario.rol !== "ADMIN") {
    throw new AuthError("Solo quien inició puede registrar el envío", "FORBIDDEN");
  }

  const evidencias = input.evidenciaEnvioAdjuntos ?? [];
  const fechaEnvio = input.fechaEnvioRegistrado;
  const origen: OrigenNoRenovacion =
    existing.iniciadoPorRol === "ARRENDATARIO" ? "ARRENDATARIO" : "ARRENDADOR";

  const updated = await getNoRenovacionRepository().update(id, {
    medioEnvio: input.medioEnvio,
    empresaMensajeria: input.empresaMensajeria,
    numeroGuiaCorreoCertificado: input.numeroGuiaCorreoCertificado,
    fechaEnvioRegistrado: fechaEnvio,
    evidenciaEnvioAdjuntos: evidencias,
    estado: "ENVIO_REGISTRADO",
    estadoEnvio: "REGISTRADO",
  });

  if (!updated) return null;

  const contratoPrev = { ...contrato };
  await getContratosRepository().update(contrato.id, {
    noRenovar: true,
    fechaNoRenovacionRegistrada: fechaEnvio,
    origenNoRenovacion: origen,
    noRenovacionId: id,
  });

  const actor = auditActorFromUsuario(usuario);
  const auditCtx = await contextoDesdeContrato(existing.contratoId);

  await traceEvento(actor, {
    entidadTipo: "NO_RENOVACION",
    entidadId: id,
    accion: "NO_RENOVACION_ENVIO_REGISTRADO",
    descripcion: `Envío registrado (${input.medioEnvio}) — ${updated.code}`,
    estadoAnterior: existing.estado,
    estadoNuevo: updated.estado,
    contexto: auditCtx,
    metadata: metadataExpediente(updated),
  });

  await traceEvento(actor, {
    entidadTipo: "CONTRATO",
    entidadId: contrato.id,
    accion: "CONTRATO_MARCADO_NO_RENOVAR",
    descripcion: `Contrato ${contrato.code} marcado para no renovación`,
    estadoNuevo: "noRenovar",
    contexto: auditCtx,
    valoresAnteriores: {
      noRenovar: contratoPrev.noRenovar,
    },
    valoresNuevos: {
      noRenovar: true,
      origenNoRenovacion: origen,
      noRenovacionId: id,
    },
    metadata: metadataExpediente(updated),
  });

  if (evidencias.length > 0 && debeRegistrarTrazabilidadAdjuntos(evidencias)) {
    await traceAdjuntosAgregados(actor, {
      entidadTipo: "NO_RENOVACION",
      entidadId: id,
      adjuntos: evidencias,
      descripcion: `Evidencias de envío — ${updated.code}`,
      contexto: auditCtx,
    });
  }

  const rolDestinatario =
    existing.iniciadoPorRol === "ARRENDADOR" ? "ARRENDATARIO" : "ARRENDADOR";

  await registrarNotificacion({
    contratoId: contrato.id,
    tipo: "NO_RENOVACION",
    destinatarioNombre: updated.destinatarioNombre,
    destinatarioEmail: updated.destinatarioEmail,
    rolDestinatario,
    asunto: `Comunicación de no renovación — ${updated.code}`,
    mensaje: `Se registró una comunicación formal de no renovación (${updated.code}) respecto del contrato ${contrato.code} (${inmueble.titulo}). Revise el expediente en el módulo de no renovación.`,
    referenciaModulo: "No renovación",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  return updated;
}

export async function anularExpedienteNoRenovacion(id: string) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) {
    throw new AuthError("Expediente no encontrado", "FORBIDDEN");
  }
  const { usuario } = await assertAccesoExpediente(existing);

  if (existing.iniciadoPorId !== usuario.id && usuario.rol !== "ADMIN") {
    throw new AuthError("Sin permiso para anular", "FORBIDDEN");
  }
  if (existing.estado === "ENVIO_REGISTRADO") {
    throw new AuthError("No se puede anular un expediente con envío registrado", "FORBIDDEN");
  }

  const updated = await getNoRenovacionRepository().update(id, { estado: "ANULADA" });
  if (updated) {
    const actor = auditActorFromUsuario(usuario);
    const auditCtx = await contextoDesdeContrato(existing.contratoId);
    await traceCambioEstado(actor, {
      entidadTipo: "NO_RENOVACION",
      entidadId: id,
      estadoAnterior: existing.estado,
      estadoNuevo: "ANULADA",
      descripcion: `Expediente ${updated.code} anulado`,
      contexto: auditCtx,
    });
  }
  return updated;
}

/** @deprecated Usar flujo de expediente unilateral */
export async function crearNoRenovacion(data: CreateInput<NoRenovacion>) {
  return crearExpedienteNoRenovacion(data.contratoId);
}

/** @deprecated */
export async function actualizarNoRenovacion(id: string, data: UpdateInput<NoRenovacion>) {
  return actualizarExpedienteNoRenovacion(id, data);
}

/** @deprecated */
export async function simularEnvioNotificacionNoRenovacion(id: string) {
  const existing = await getNoRenovacionRepository().findById(id);
  if (!existing) return null;
  return registrarEnvioNoRenovacion(id, {
    medioEnvio: "EMAIL",
    fechaEnvioRegistrado: new Date().toISOString().slice(0, 10),
  });
}

export async function eliminarNoRenovacion(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(usuario.rol, "no-renovacion");
  if (usuario.rol !== "ADMIN") {
    throw new AuthError("Solo administración puede eliminar expedientes", "FORBIDDEN");
  }
  return getNoRenovacionRepository().delete(id);
}
