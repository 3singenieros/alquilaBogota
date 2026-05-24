import { AuthError } from "@/lib/auth/errors";
import { loadAuthContext } from "@/lib/auth/load-context";
import { assertModuleAccess, requireSession } from "@/services/auth.service";
import { rolEfectivo } from "@/lib/auth/rol";
import {
  filterContratos,
  filterMantenimiento,
  inmuebleIdsForUser,
  inmueblesParaMantenimiento,
} from "@/lib/auth/scopes";
import { auditActorFromUsuario, getAuditActor } from "@/lib/audit/actor";
import { contextoDesdeInmueble } from "@/lib/audit/context";
import { traceAdjuntosAgregados } from "@/lib/audit/trace-adjuntos";
import {
  accionActualizacionMantenimiento,
  accionCambioEstadoMantenimiento,
  traceCambioEstado,
  traceCreado,
  traceEliminado,
  traceEvento,
} from "@/lib/audit/trace-helper";
import {
  combinarAdjuntos,
  prepararEvidenciasMantenimiento,
} from "@/lib/archivos-adjuntos";
import {
  arrendatarioPuedeEditarSolicitud,
  arrendadorPuedeGestionarEstado,
  CAMPOS_SOLICITUD_MANTENIMIENTO,
  MENSAJE_EDICION_BLOQUEADA,
  puedeAgregarComentario,
} from "@/lib/mantenimiento-reglas";
import {
  getComentariosMantenimientoRepository,
  getContratosRepository,
  getInmueblesRepository,
  getMantenimientoRepository,
  getUsuariosRepository,
} from "@/repositories";
import { registrarNotificacion } from "@/services/notificaciones.service";
import type {
  ComentarioMantenimiento,
  CreateInput,
  EstadoMantenimiento,
  Mantenimiento,
  UpdateInput,
} from "@/types";

export async function contextoMantenimiento(inmuebleId: string) {
  return contextoDesdeInmueble(inmuebleId);
}

export async function assertAccesoMantenimiento(existing: Mantenimiento) {
  const { usuario } = await requireSession();
  const { inmuebles, contratos } = await loadAuthContext();
  const visible = filterMantenimiento(
    [existing],
    usuario,
    inmuebles,
    contratos
  );
  if (visible.length === 0) {
    throw new AuthError("Ticket no encontrado o sin permiso", "FORBIDDEN");
  }
  return { usuario, rol: rolEfectivo(usuario) };
}

async function assertInmuebleMantenimiento(inmuebleId: string) {
  const { usuario } = await requireSession();
  if (rolEfectivo(usuario) === "ARRENDATARIO") {
    const { contratos } = await loadAuthContext();
    const allowedInm = new Set(
      filterContratos(contratos, usuario).map((c) => c.inmuebleId)
    );
    if (!allowedInm.has(inmuebleId)) {
      throw new AuthError(
        "Solo puedes solicitar mantenimiento de tu inmueble arrendado",
        "FORBIDDEN"
      );
    }
    return;
  }
  const inmueble = await getInmueblesRepository().findById(inmuebleId);
  const allowed = inmuebleIdsForUser(usuario, inmueble ? [inmueble] : []);
  if (!allowed.has(inmuebleId)) {
    throw new AuthError("Inmueble no permitido para este usuario", "FORBIDDEN");
  }
}

export async function resolverArrendador(inmuebleId: string) {
  const inmueble = await getInmueblesRepository().findById(inmuebleId);
  if (!inmueble) return { nombre: "Arrendador", email: "" };
  const usuarios = await getUsuariosRepository().findAll();
  const u = usuarios.find((x) => x.id === inmueble.arrendadorId);
  return { nombre: u?.nombre ?? "Arrendador", email: u?.email ?? "" };
}

export async function resolverArrendatario(solicitadoPorId: string, inmuebleId: string) {
  const usuarios = await getUsuariosRepository().findAll();
  const u = usuarios.find((x) => x.id === solicitadoPorId);
  if (u) return { nombre: u.nombre, email: u.email };
  const contratos = await getContratosRepository().findAll();
  const c = contratos.find(
    (x) => x.inmuebleId === inmuebleId && x.estado === "CONFIRMADO"
  );
  return {
    nombre: c?.nombreArrendatario ?? "Arrendatario",
    email: c?.emailArrendatario ?? "",
  };
}

function validarCamposSolicitud(
  rol: ReturnType<typeof rolEfectivo>,
  existing: Mantenimiento,
  data: UpdateInput<Mantenimiento>
) {
  if (rol !== "ARRENDATARIO") return;
  if (!arrendatarioPuedeEditarSolicitud(existing.estado)) {
    const cambia =
      (data.titulo !== undefined && data.titulo !== existing.titulo) ||
      (data.descripcion !== undefined && data.descripcion !== existing.descripcion) ||
      (data.prioridad !== undefined && data.prioridad !== existing.prioridad) ||
      (data.adjuntoUrl !== undefined && data.adjuntoUrl !== existing.adjuntoUrl) ||
      (data.evidenciasAdjuntas !== undefined &&
        JSON.stringify(data.evidenciasAdjuntas) !==
          JSON.stringify(existing.evidenciasAdjuntas));
    if (cambia) {
      throw new AuthError(MENSAJE_EDICION_BLOQUEADA, "FORBIDDEN");
    }
  }
}

function extraerSoloSolicitud(
  data: UpdateInput<Mantenimiento>,
  existing?: Mantenimiento
): UpdateInput<Mantenimiento> {
  const out: UpdateInput<Mantenimiento> = {};
  if (data.titulo !== undefined) out.titulo = data.titulo;
  if (data.descripcion !== undefined) out.descripcion = data.descripcion;
  if (data.prioridad !== undefined) out.prioridad = data.prioridad;
  if (data.evidenciasAdjuntas !== undefined || data.adjuntoUrl !== undefined) {
    const prep = prepararEvidenciasMantenimiento(
      data.evidenciasAdjuntas,
      data.adjuntoUrl ?? existing?.adjuntoUrl
    );
    out.evidenciasAdjuntas = prep.evidenciasAdjuntas;
    out.adjuntoUrl = prep.adjuntoUrl;
  }
  return out;
}

async function notificarTicketCreado(m: Mantenimiento) {
  const arrendador = await resolverArrendador(m.inmuebleId);
  const ctx = await contextoMantenimiento(m.inmuebleId);
  await registrarNotificacion({
    contratoId: ctx.contratoId,
    tipo: "MANTENIMIENTO_CREADO",
    destinatarioNombre: arrendador.nombre,
    destinatarioEmail: arrendador.email,
    rolDestinatario: "ARRENDADOR",
    asunto: `Nuevo ticket de mantenimiento — ${m.titulo}`,
    mensaje: `Se creó el ticket ${m.code} (${m.prioridad}) en el inmueble asociado.`,
    referenciaModulo: "Mantenimiento",
    estado: "PENDIENTE",
  });
}

export async function listarMantenimiento() {
  const { usuario } = await requireSession();
  assertModuleAccess(rolEfectivo(usuario), "mantenimiento");
  const { inmuebles, contratos } = await loadAuthContext();
  const items = await getMantenimientoRepository().findAll();
  return filterMantenimiento(items, usuario, inmuebles, contratos);
}

export async function listarComentariosMantenimiento(mantenimientoId?: string) {
  await requireSession();
  const all = await getComentariosMantenimientoRepository().findAll();
  if (!mantenimientoId) return all;
  return all.filter((c) => c.mantenimientoId === mantenimientoId);
}

export async function listarComentariosVisibles() {
  const tickets = await listarMantenimiento();
  const ids = new Set(tickets.map((t) => t.id));
  const all = await getComentariosMantenimientoRepository().findAll();
  return all.filter((c) => ids.has(c.mantenimientoId));
}

export async function listarInmueblesParaMantenimiento() {
  const { usuario } = await requireSession();
  const { inmuebles, contratos } = await loadAuthContext();
  return inmueblesParaMantenimiento(inmuebles, contratos, usuario);
}

export async function crearMantenimiento(data: CreateInput<Mantenimiento>) {
  const { usuario } = await requireSession();
  const rol = rolEfectivo(usuario);
  assertModuleAccess(rol, "mantenimiento");
  await assertInmuebleMantenimiento(data.inmuebleId);
  const ev = prepararEvidenciasMantenimiento(data.evidenciasAdjuntas, data.adjuntoUrl);
  const payload: CreateInput<Mantenimiento> = {
    ...data,
    estado: "ABIERTO",
    tipoResponsabilidad: data.tipoResponsabilidad ?? "POR_DEFINIR",
    tipoMantenimiento: data.tipoMantenimiento ?? "CORRECTIVO",
    aceptacionArrendatario: "NO_APLICA",
    evidenciasAdjuntas: ev.evidenciasAdjuntas,
    adjuntoUrl: ev.adjuntoUrl,
    solicitadoPorId:
      rol === "ARRENDATARIO" ? usuario.id : data.solicitadoPorId ?? usuario.id,
  };
  const created = await getMantenimientoRepository().create(payload);
  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoMantenimiento(data.inmuebleId);
  await traceCreado(
    actor,
    "MANTENIMIENTO",
    created.id,
    `Ticket ${created.code} creado: ${created.titulo}`,
    ctx,
    "MANTENIMIENTO_CREADO"
  );
  if (ev.evidenciasAdjuntas.length > 0) {
    await traceAdjuntosAgregados(actor, {
      entidadTipo: "MANTENIMIENTO",
      entidadId: created.id,
      adjuntos: ev.evidenciasAdjuntas,
      accion: "MANTENIMIENTO_EVIDENCIA_ADJUNTADA",
      descripcion: `Evidencias iniciales (${ev.evidenciasAdjuntas.length})`,
      contexto: ctx,
    });
  }
  await notificarTicketCreado(created);
  return created;
}

/** Actualiza solo contenido de solicitud (título, descripción, prioridad, evidencia). */
export async function actualizarContenidoMantenimiento(
  id: string,
  data: UpdateInput<Mantenimiento>
) {
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) throw new AuthError("Ticket no encontrado", "FORBIDDEN");

  const { usuario, rol } = await assertAccesoMantenimiento(existing);
  assertModuleAccess(rol, "mantenimiento");

  if (rol === "ARRENDATARIO" && existing.solicitadoPorId !== usuario.id) {
    throw new AuthError("Solo puedes editar tus solicitudes", "FORBIDDEN");
  }

  const soloSolicitud = extraerSoloSolicitud(data, existing);
  validarCamposSolicitud(rol, existing, soloSolicitud);

  if (rol === "ARRENDATARIO" && !arrendatarioPuedeEditarSolicitud(existing.estado)) {
    throw new AuthError(MENSAJE_EDICION_BLOQUEADA, "FORBIDDEN");
  }

  await assertInmuebleMantenimiento(existing.inmuebleId);

  const updated = await getMantenimientoRepository().update(id, soloSolicitud);
  if (!updated) return null;

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoMantenimiento(existing.inmuebleId);
  const antes = { ...existing } as Record<string, unknown>;
  const despues = { ...updated } as Record<string, unknown>;
  const campos = CAMPOS_SOLICITUD_MANTENIMIENTO.filter(
    (k) => antes[k] !== despues[k]
  );
  if (campos.length > 0) {
    const valoresAnteriores: Record<string, unknown> = {};
    const valoresNuevos: Record<string, unknown> = {};
    for (const k of campos) {
      valoresAnteriores[k] = antes[k];
      valoresNuevos[k] = despues[k];
    }
    await traceEvento(actor, {
      entidadTipo: "MANTENIMIENTO",
      entidadId: id,
      accion: accionActualizacionMantenimiento(antes, despues),
      descripcion: `Ticket ${updated.code} actualizado (${campos.join(", ")})`,
      valoresAnteriores,
      valoresNuevos,
      contexto: ctx,
    });
  }

  return updated;
}

/** Cambio de estado y gestión (arrendador / admin). */
export async function cambiarEstadoMantenimiento(
  id: string,
  input: {
    estado: EstadoMantenimiento;
    asignadoA?: string;
    observacionesGestion?: string;
    motivoRechazo?: string;
  }
) {
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) throw new AuthError("Ticket no encontrado", "FORBIDDEN");

  const { usuario, rol } = await assertAccesoMantenimiento(existing);
  assertModuleAccess(rol, "mantenimiento");

  if (!arrendadorPuedeGestionarEstado(rol)) {
    throw new AuthError("No puedes cambiar el estado del ticket", "FORBIDDEN");
  }

  if (input.estado === "RECHAZADO" && !input.motivoRechazo?.trim()) {
    throw new AuthError("El motivo de rechazo es obligatorio", "FORBIDDEN");
  }

  if (input.estado === "CERRADO") {
    throw new AuthError(
      "Usa el formulario de cierre del ticket para cerrar con soporte documental",
      "FORBIDDEN"
    );
  }

  const patch: UpdateInput<Mantenimiento> = {
    estado: input.estado,
    asignadoA: input.asignadoA?.trim() || existing.asignadoA,
    observacionesGestion:
      input.observacionesGestion?.trim() || existing.observacionesGestion,
  };
  if (input.estado === "RESUELTO") {
    patch.fechaCierre = new Date().toISOString().slice(0, 10);
  }

  const updated = await getMantenimientoRepository().update(id, patch);
  if (!updated) return null;

  const actor = auditActorFromUsuario(usuario);
  const ctx = await contextoMantenimiento(existing.inmuebleId);
  await traceCambioEstado(actor, {
    entidadTipo: "MANTENIMIENTO",
    entidadId: id,
    estadoAnterior: existing.estado,
    estadoNuevo: updated.estado,
    descripcion: `Ticket ${updated.code}: estado ${existing.estado} → ${updated.estado}`,
    accionEspecifica: accionCambioEstadoMantenimiento(
      existing.estado,
      updated.estado
    ),
    contexto: ctx,
    metadata: input.motivoRechazo
      ? { motivoRechazo: input.motivoRechazo }
      : undefined,
  });

  const arrendatario = await resolverArrendatario(
    existing.solicitadoPorId,
    existing.inmuebleId
  );
  await registrarNotificacion({
    contratoId: ctx.contratoId,
    tipo: "MANTENIMIENTO_ESTADO_CAMBIADO",
    destinatarioNombre: arrendatario.nombre,
    destinatarioEmail: arrendatario.email,
    rolDestinatario: "ARRENDATARIO",
    asunto: `Ticket ${updated.code} — ${updated.estado}`,
    mensaje: `El arrendador actualizó el ticket a estado ${updated.estado}.`,
    referenciaModulo: "Mantenimiento",
    estado: "SIMULADA",
    fechaEnvioSimulado: new Date().toISOString(),
  });

  if (updated.estado === "CERRADO") {
    await registrarNotificacion({
      contratoId: ctx.contratoId,
      tipo: "MANTENIMIENTO_CERRADO",
      destinatarioNombre: arrendatario.nombre,
      destinatarioEmail: arrendatario.email,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Ticket cerrado — ${updated.code}`,
      mensaje: `El ticket de mantenimiento ${updated.titulo} fue cerrado.`,
      referenciaModulo: "Mantenimiento",
      estado: "SIMULADA",
      fechaEnvioSimulado: new Date().toISOString(),
    });
  }

  return updated;
}

export async function agregarComentarioMantenimiento(
  mantenimientoId: string,
  input: { comentario: string; adjuntoUrl?: string }
) {
  const existing = await getMantenimientoRepository().findById(mantenimientoId);
  if (!existing) throw new AuthError("Ticket no encontrado", "FORBIDDEN");

  const { usuario, rol } = await assertAccesoMantenimiento(existing);
  assertModuleAccess(rol, "mantenimiento");

  const texto = input.comentario.trim();
  if (!texto) {
    throw new AuthError("El comentario no puede estar vacío", "FORBIDDEN");
  }

  if (!puedeAgregarComentario(rol, existing.estado)) {
    throw new AuthError(
      "No se pueden agregar comentarios en este estado del ticket",
      "FORBIDDEN"
    );
  }

  const ctx = await contextoMantenimiento(existing.inmuebleId);
  const comentario: ComentarioMantenimiento =
    await getComentariosMantenimientoRepository().create({
      mantenimientoId,
      contratoId: ctx.contratoId,
      inmuebleId: existing.inmuebleId,
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      usuarioEmail: usuario.email,
      usuarioRol: rol,
      comentario: texto,
      adjuntoUrl: input.adjuntoUrl,
    });

  const actor = auditActorFromUsuario(usuario);
  await traceEvento(actor, {
    entidadTipo: "MANTENIMIENTO",
    entidadId: mantenimientoId,
    accion: "MANTENIMIENTO_COMENTARIO_AGREGADO",
    descripcion: `${usuario.nombre} agregó un comentario al ticket ${existing.code}`,
    contexto: ctx,
    metadata: { comentarioId: comentario.id },
  });

  if (rol === "ARRENDATARIO") {
    const arrendador = await resolverArrendador(existing.inmuebleId);
    await registrarNotificacion({
      contratoId: ctx.contratoId,
      tipo: "MANTENIMIENTO_COMENTARIO",
      destinatarioNombre: arrendador.nombre,
      destinatarioEmail: arrendador.email,
      rolDestinatario: "ARRENDADOR",
      asunto: `Nuevo comentario en ticket ${existing.code}`,
      mensaje: texto.slice(0, 120),
      referenciaModulo: "Mantenimiento",
      estado: "PENDIENTE",
    });
  } else {
    const arrendatario = await resolverArrendatario(
      existing.solicitadoPorId,
      existing.inmuebleId
    );
    await registrarNotificacion({
      contratoId: ctx.contratoId,
      tipo: "MANTENIMIENTO_COMENTARIO",
      destinatarioNombre: arrendatario.nombre,
      destinatarioEmail: arrendatario.email,
      rolDestinatario: "ARRENDATARIO",
      asunto: `Respuesta en ticket ${existing.code}`,
      mensaje: texto.slice(0, 120),
      referenciaModulo: "Mantenimiento",
      estado: "SIMULADA",
      fechaEnvioSimulado: new Date().toISOString(),
    });
  }

  return comentario;
}

/** @deprecated Usar actualizarContenidoMantenimiento o cambiarEstadoMantenimiento */
export async function actualizarMantenimiento(
  id: string,
  data: UpdateInput<Mantenimiento>
) {
  if (data.estado !== undefined) {
    return cambiarEstadoMantenimiento(id, {
      estado: data.estado,
      asignadoA: data.asignadoA,
      observacionesGestion: data.observacionesGestion,
    });
  }
  return actualizarContenidoMantenimiento(id, data);
}

export async function eliminarMantenimiento(id: string) {
  const { usuario } = await requireSession();
  assertModuleAccess(rolEfectivo(usuario), "mantenimiento");
  if (rolEfectivo(usuario) !== "ADMIN") {
    throw new AuthError("No puedes eliminar registros de mantenimiento", "FORBIDDEN");
  }
  const existing = await getMantenimientoRepository().findById(id);
  if (!existing) return false;
  const actor = await getAuditActor();
  const ctx = await contextoMantenimiento(existing.inmuebleId);
  await traceEliminado(
    actor,
    "MANTENIMIENTO",
    id,
    `Ticket ${existing.code} eliminado`,
    ctx
  );
  return getMantenimientoRepository().delete(id);
}
