import type { AuditActor } from "@/lib/audit/actor";
import type { ContextoTrazabilidad } from "@/lib/audit/context";
import { metadataAdjuntosTrazabilidad } from "@/lib/archivos-adjuntos";
import { traceEvento } from "@/lib/audit/trace-helper";
import type { ArchivoAdjunto } from "@/types";
import type {
  AccionTrazabilidad,
  EntidadTipoTrazabilidad,
} from "@/types/trazabilidad";

export async function traceAdjuntosAgregados(
  actor: AuditActor,
  input: {
    entidadTipo: EntidadTipoTrazabilidad;
    entidadId: string;
    adjuntos: ArchivoAdjunto[];
    accion?: AccionTrazabilidad;
    descripcion: string;
    contexto?: Partial<ContextoTrazabilidad>;
  }
) {
  if (input.adjuntos.length === 0) return;
  await traceEvento(actor, {
    entidadTipo: input.entidadTipo,
    entidadId: input.entidadId,
    accion: input.accion ?? "DOCUMENTO_ADJUNTADO",
    descripcion: input.descripcion,
    contexto: input.contexto,
    metadata: metadataAdjuntosTrazabilidad(
      input.adjuntos,
      input.entidadTipo,
      input.entidadId
    ),
  });
}

export async function traceAdjuntosEliminados(
  actor: AuditActor,
  input: {
    entidadTipo: EntidadTipoTrazabilidad;
    entidadId: string;
    adjuntos: ArchivoAdjunto[];
    descripcion: string;
    contexto?: Partial<ContextoTrazabilidad>;
  }
) {
  if (input.adjuntos.length === 0) return;
  await traceEvento(actor, {
    entidadTipo: input.entidadTipo,
    entidadId: input.entidadId,
    accion: "DOCUMENTO_ELIMINADO",
    descripcion: input.descripcion,
    contexto: input.contexto,
    metadata: metadataAdjuntosTrazabilidad(
      input.adjuntos,
      input.entidadTipo,
      input.entidadId
    ),
  });
}
