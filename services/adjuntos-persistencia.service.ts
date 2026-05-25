import { auditActorFromUsuario } from "@/lib/audit/actor";
import { traceAdjuntosAgregados, traceAdjuntosEliminados } from "@/lib/audit/trace-adjuntos";
import type { CargadoPorAdjunto } from "@/lib/archivos-adjuntos";
import type { ContextoTrazabilidad } from "@/lib/audit/context";
import type { StorageBucketKey } from "@/lib/config";
import { getFileRepository } from "@/repositories";
import { requireSession } from "@/services/auth.service";
import {
  deleteFile,
  uploadFile,
  uploadMultipleFiles,
  type FileUploadOptions,
} from "@/services/file-storage.service";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";

export type SubirArchivosContext = FileUploadOptions & {
  entidadTipo: EntidadTipoTrazabilidad;
  cargadoPor?: CargadoPorAdjunto;
  linkContratoId?: string;
  linkMantenimiento?: { id: string; tipoDocumento?: string };
  contextoTrazabilidad?: Partial<ContextoTrazabilidad>;
  registrarTrazabilidad?: boolean;
};

function enrichAdjunto(adjunto: ArchivoAdjunto, ctx: SubirArchivosContext): ArchivoAdjunto {
  return {
    ...adjunto,
    cargadoPorId: ctx.cargadoPor?.id ?? ctx.usuarioId,
    cargadoPorNombre: ctx.cargadoPor?.nombre ?? adjunto.cargadoPorNombre,
    cargadoPorEmail: ctx.cargadoPor?.email ?? adjunto.cargadoPorEmail,
    cargadoPorRol: ctx.cargadoPor?.rol ?? adjunto.cargadoPorRol,
  };
}

export async function persistirAdjuntoEnDb(
  adjunto: ArchivoAdjunto,
  ctx: SubirArchivosContext
): Promise<ArchivoAdjunto> {
  const repo = getFileRepository();
  const existing = await repo.findById(adjunto.id);
  const payload = {
    ...adjunto,
    entidadTipo: ctx.entidadTipo,
    entidadId: ctx.entidadId,
    contratoId: ctx.contratoId ?? ctx.linkContratoId,
    inmuebleId: ctx.inmuebleId,
    uploadedBy: ctx.usuarioId ?? adjunto.uploadedBy,
  };

  const saved = existing
    ? ({ ...existing, ...payload } as ArchivoAdjunto)
    : await repo.create(payload);

  if (ctx.linkContratoId) {
    await repo.linkToContrato(ctx.linkContratoId, saved.id, ctx.entidadTipo);
  }
  if (ctx.linkMantenimiento) {
    await repo.linkToMantenimiento(
      ctx.linkMantenimiento.id,
      saved.id,
      ctx.linkMantenimiento.tipoDocumento
    );
  }

  return saved;
}

export async function subirArchivoPersistido(
  file: File | Blob,
  ctx: SubirArchivosContext,
  filename?: string
): Promise<ArchivoAdjunto> {
  const uploaded = await uploadFile({
    ...ctx,
    file,
    filename: filename ?? (file instanceof File ? file.name : undefined),
    usuarioId: ctx.usuarioId ?? ctx.cargadoPor?.id,
    cargadoPorNombre: ctx.cargadoPor?.nombre,
    cargadoPorEmail: ctx.cargadoPor?.email,
    cargadoPorRol: ctx.cargadoPor?.rol,
  });

  const adjunto = enrichAdjunto(uploaded.adjunto, ctx);
  return persistirAdjuntoEnDb(adjunto, ctx);
}

export async function subirArchivosPersistidos(
  files: File[],
  ctx: SubirArchivosContext
): Promise<ArchivoAdjunto[]> {
  if (files.length === 0) return [];

  const uploaded = await uploadMultipleFiles(files, {
    ...ctx,
    usuarioId: ctx.usuarioId ?? ctx.cargadoPor?.id,
    cargadoPorNombre: ctx.cargadoPor?.nombre,
    cargadoPorEmail: ctx.cargadoPor?.email,
    cargadoPorRol: ctx.cargadoPor?.rol,
  });

  const adjuntos: ArchivoAdjunto[] = [];
  for (const item of uploaded) {
    adjuntos.push(await persistirAdjuntoEnDb(enrichAdjunto(item.adjunto, ctx), ctx));
  }

  if (ctx.registrarTrazabilidad !== false && adjuntos.length > 0) {
    const { usuario } = await requireSession();
    const actor = auditActorFromUsuario(usuario);
    await traceAdjuntosAgregados(actor, {
      entidadTipo: ctx.entidadTipo,
      entidadId: ctx.entidadId,
      adjuntos,
      descripcion: `${adjuntos.length} archivo(s) adjuntado(s)`,
      contexto: ctx.contextoTrazabilidad,
    });
  }

  return adjuntos;
}

export async function subirYCombinarAdjuntos(
  existentes: ArchivoAdjunto[] | undefined,
  pendingFiles: File[],
  ctx: SubirArchivosContext
): Promise<ArchivoAdjunto[]> {
  const nuevos = await subirArchivosPersistidos(pendingFiles, ctx);
  return [...(existentes ?? []), ...nuevos];
}

export async function eliminarArchivoAdjunto(
  adjunto: ArchivoAdjunto,
  ctx: {
    entidadTipo: EntidadTipoTrazabilidad;
    entidadId: string;
    contextoTrazabilidad?: Partial<ContextoTrazabilidad>;
  }
): Promise<boolean> {
  const { usuario } = await requireSession();
  if (adjunto.bucket && adjunto.path) {
    await deleteFile(adjunto.bucket, adjunto.path);
  }
  const ok = await getFileRepository().delete(adjunto.id);
  if (ok) {
    const actor = auditActorFromUsuario(usuario);
    await traceAdjuntosEliminados(actor, {
      entidadTipo: ctx.entidadTipo,
      entidadId: ctx.entidadId,
      adjuntos: [adjunto],
      descripcion: `Archivo eliminado: ${adjunto.nombre}`,
      contexto: ctx.contextoTrazabilidad,
    });
  }
  return ok;
}

export function bucketParaModulo(
  modulo: "contratos" | "pagos" | "servicios" | "mantenimiento" | "no-renovacion"
): StorageBucketKey {
  const map: Record<string, StorageBucketKey> = {
    contratos: "contratos",
    pagos: "pagos",
    servicios: "servicios",
    mantenimiento: "mantenimiento",
    "no-renovacion": "noRenovacion",
  };
  return map[modulo] ?? "evidencias";
}
