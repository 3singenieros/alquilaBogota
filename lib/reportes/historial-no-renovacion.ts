import type { NoRenovacion } from "@/types";
import type { EventoTrazabilidad } from "@/types/trazabilidad";

const ACCIONES_NR = new Set([
  "NO_RENOVACION_CREADA",
  "NO_RENOVACION_SOLICITADA",
  "NO_RENOVACION_DOCUMENTO_GENERADO",
  "NO_RENOVACION_PDF_DESCARGADO",
  "NO_RENOVACION_ENVIO_REGISTRADO",
  "NO_RENOVACION_NOTIFICADA",
  "CONTRATO_MARCADO_NO_RENOVAR",
  "DOCUMENTO_ADJUNTADO",
]);

export function eventoRelacionadoNoRenovacion(
  evento: EventoTrazabilidad,
  nr: NoRenovacion
): boolean {
  if (evento.entidadTipo === "NO_RENOVACION" && evento.entidadId === nr.id) {
    return true;
  }

  if (evento.accion === "DOCUMENTO_ADJUNTADO") {
    return evento.entidadTipo === "NO_RENOVACION" && evento.entidadId === nr.id;
  }

  if (evento.accion === "CONTRATO_MARCADO_NO_RENOVAR") {
    if (evento.contratoId !== nr.contratoId) return false;
    const ref =
      evento.valoresNuevos?.noRenovacionId ?? evento.metadata?.noRenovacionId;
    return ref === nr.id || ref === undefined;
  }

  if (!ACCIONES_NR.has(evento.accion)) return false;

  if (evento.entidadTipo === "NO_RENOVACION" && evento.entidadId !== nr.id) {
    return false;
  }

  return (
    evento.contratoId === nr.contratoId ||
    (evento.inmuebleId === nr.inmuebleId &&
      evento.entidadTipo === "NO_RENOVACION" &&
      evento.entidadId === nr.id)
  );
}
