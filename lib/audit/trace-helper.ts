import type { AuditActor } from "@/lib/audit/actor";
import {
  inferirContextoTrazabilidad,
  type ContextoTrazabilidad,
} from "@/lib/audit/context";
import {
  registrarCambioEstado,
  registrarEvento,
} from "@/services/trazabilidad.service";
import type {
  AccionTrazabilidad,
  EntidadTipoTrazabilidad,
} from "@/types/trazabilidad";

function pickDiff<T extends Record<string, unknown>>(
  antes: T,
  despues: T,
  keys: (keyof T)[]
): { valoresAnteriores: Record<string, unknown>; valoresNuevos: Record<string, unknown> } | null {
  const valoresAnteriores: Record<string, unknown> = {};
  const valoresNuevos: Record<string, unknown> = {};
  let changed = false;
  for (const key of keys) {
    if (antes[key] !== despues[key]) {
      valoresAnteriores[key as string] = antes[key];
      valoresNuevos[key as string] = despues[key];
      changed = true;
    }
  }
  return changed ? { valoresAnteriores, valoresNuevos } : null;
}

export async function traceEvento(
  actor: AuditActor,
  input: {
    entidadTipo: EntidadTipoTrazabilidad;
    entidadId: string;
    accion: AccionTrazabilidad;
    descripcion: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    valoresAnteriores?: Record<string, unknown>;
    valoresNuevos?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    contexto?: Partial<ContextoTrazabilidad>;
  }
) {
  const ctx = await inferirContextoTrazabilidad(
    input.entidadTipo,
    input.entidadId,
    input.contexto
  );
  return registrarEvento({
    entidadTipo: input.entidadTipo,
    entidadId: input.entidadId,
    accion: input.accion,
    descripcion: input.descripcion,
    estadoAnterior: input.estadoAnterior,
    estadoNuevo: input.estadoNuevo,
    valoresAnteriores: input.valoresAnteriores,
    valoresNuevos: input.valoresNuevos,
    metadata: input.metadata,
    contratoId: ctx.contratoId,
    inmuebleId: ctx.inmuebleId,
    pagoId: ctx.pagoId,
    usuarioAfectadoId: ctx.usuarioAfectadoId,
    ...actor,
  });
}

export async function traceCreado(
  actor: AuditActor,
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string,
  descripcion: string,
  contexto?: Partial<ContextoTrazabilidad>,
  accion: AccionTrazabilidad = "CREADO"
) {
  return traceEvento(actor, {
    entidadTipo,
    entidadId,
    accion,
    descripcion,
    contexto,
  });
}

export async function traceEliminado(
  actor: AuditActor,
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string,
  descripcion: string,
  contexto?: Partial<ContextoTrazabilidad>
) {
  return traceEvento(actor, {
    entidadTipo,
    entidadId,
    accion: "ELIMINADO",
    descripcion,
    contexto,
  });
}

export async function traceCambioEstado(
  actor: AuditActor,
  input: {
    entidadTipo: EntidadTipoTrazabilidad;
    entidadId: string;
    estadoAnterior: string;
    estadoNuevo: string;
    descripcion: string;
    accionEspecifica?: AccionTrazabilidad;
    valoresAnteriores?: Record<string, unknown>;
    valoresNuevos?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    contexto?: Partial<ContextoTrazabilidad>;
  }
) {
  const ctx = await inferirContextoTrazabilidad(
    input.entidadTipo,
    input.entidadId,
    input.contexto
  );
  await registrarCambioEstado({
    entidadTipo: input.entidadTipo,
    entidadId: input.entidadId,
    estadoAnterior: input.estadoAnterior,
    estadoNuevo: input.estadoNuevo,
    descripcion: input.descripcion,
    accionEspecifica: input.accionEspecifica,
    valoresAnteriores: input.valoresAnteriores,
    valoresNuevos: input.valoresNuevos,
    metadata: input.metadata,
    contratoId: ctx.contratoId,
    inmuebleId: ctx.inmuebleId,
    pagoId: ctx.pagoId,
    usuarioAfectadoId: ctx.usuarioAfectadoId,
    actor,
  });
}

function readField(obj: object, key: string): unknown {
  return (obj as Record<string, unknown>)[key];
}

export async function traceActualizacion<T extends object>(
  actor: AuditActor,
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string,
  antes: T,
  despues: T,
  opts: {
    descripcion?: string;
    estadoField?: string;
    accionPorEstado?: (anterior: string, nuevo: string) => AccionTrazabilidad | undefined;
    camposCanon?: boolean;
    documentoField?: string;
    contexto?: Partial<ContextoTrazabilidad>;
    camposExtra?: string[];
  }
) {
  const estadoKey = opts.estadoField ?? "estado";
  const antesEstado = String(readField(antes, estadoKey) ?? "");
  const despuesEstado = String(readField(despues, estadoKey) ?? "");

  if (antesEstado && despuesEstado && antesEstado !== despuesEstado) {
    const especifica = opts.accionPorEstado?.(antesEstado, despuesEstado);
    await traceCambioEstado(actor, {
      entidadTipo,
      entidadId,
      estadoAnterior: antesEstado,
      estadoNuevo: despuesEstado,
      descripcion:
        opts.descripcion ??
        `Estado cambió de ${antesEstado} a ${despuesEstado}`,
      accionEspecifica: especifica,
      contexto: opts.contexto,
    });
  }

  if (opts.camposCanon) {
    const diff = pickDiff(
      antes as Record<string, unknown>,
      despues as Record<string, unknown>,
      ["canonActual", "canonAnterior", "porcentajeReajuste"]
    );
    if (
      diff &&
      readField(antes, "canonActual") !== readField(despues, "canonActual")
    ) {
      await traceEvento(actor, {
        entidadTipo,
        entidadId,
        accion: "CANON_MODIFICADO",
        descripcion: `Canon actualizado: ${readField(antes, "canonActual")} → ${readField(despues, "canonActual")}`,
        valoresAnteriores: diff.valoresAnteriores,
        valoresNuevos: diff.valoresNuevos,
        contexto: opts.contexto,
      });
    }
  }

  if (opts.documentoField) {
    const docAntes = readField(antes, opts.documentoField);
    const docNuevo = readField(despues, opts.documentoField);
    if (!docAntes && docNuevo) {
      await traceEvento(actor, {
        entidadTipo,
        entidadId,
        accion: "DOCUMENTO_ADJUNTADO",
        descripcion: "Se adjuntó documento al registro",
        valoresNuevos: { [opts.documentoField]: docNuevo },
        contexto: opts.contexto,
      });
    }
  }

  const extraKeys = opts.camposExtra ?? [];
  const diffGeneral = pickDiff(
    antes as Record<string, unknown>,
    despues as Record<string, unknown>,
    extraKeys
  );
  if (diffGeneral && extraKeys.length > 0) {
    await traceEvento(actor, {
      entidadTipo,
      entidadId,
      accion: "ACTUALIZADO",
      descripcion: opts.descripcion ?? "Registro actualizado",
      valoresAnteriores: diffGeneral.valoresAnteriores,
      valoresNuevos: diffGeneral.valoresNuevos,
      contexto: opts.contexto,
    });
  }
}

export function accionCambioEstadoContrato(
  anterior: string,
  nuevo: string
): AccionTrazabilidad | undefined {
  if (anterior === "PENDIENTE_CONFIRMACION" && nuevo === "CONFIRMADO") {
    return "CONTRATO_ACEPTADO";
  }
  if (anterior === "PENDIENTE_CONFIRMACION" && nuevo === "RECHAZADO") {
    return "CONTRATO_RECHAZADO";
  }
  return undefined;
}

export function accionCambioEstadoPago(
  anterior: string,
  nuevo: string
): AccionTrazabilidad | undefined {
  if (anterior === "REPORTADO" && nuevo === "VALIDADO") return "PAGO_VALIDADO";
  if (anterior === "REPORTADO" && nuevo === "RECHAZADO") return "PAGO_RECHAZADO";
  return undefined;
}

export function accionCambioEstadoMantenimiento(
  anterior: string,
  nuevo: string
): AccionTrazabilidad | undefined {
  if (nuevo === "CERRADO") return "MANTENIMIENTO_CERRADO";
  if (nuevo === "RESUELTO") return "MANTENIMIENTO_RESUELTO";
  if (nuevo === "RECHAZADO") return "MANTENIMIENTO_RECHAZADO";
  if (anterior !== nuevo) return "MANTENIMIENTO_ESTADO_CAMBIADO";
  return undefined;
}

export function accionActualizacionMantenimiento(
  anterior: Record<string, unknown>,
  nuevo: Record<string, unknown>
): AccionTrazabilidad {
  if (anterior.adjuntoUrl !== nuevo.adjuntoUrl && nuevo.adjuntoUrl) {
    return "MANTENIMIENTO_EVIDENCIA_ADJUNTADA";
  }
  return "MANTENIMIENTO_ACTUALIZADO";
}

