"use server";

import { eliminarArchivoAdjunto, subirArchivosPersistidos } from "@/services/adjuntos-persistencia.service";
import { getSignedUrl, resolveArchivoUrl } from "@/services/file-storage.service";
import { getFileRepository } from "@/repositories";
import { requireSession } from "@/services/auth.service";
import type { StorageBucketKey } from "@/lib/config";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";

export type SubirArchivosMeta = {
  bucket: StorageBucketKey;
  entidadTipo: EntidadTipoTrazabilidad;
  entidadId: string;
  contratoId?: string;
  inmuebleId?: string;
  linkContratoId?: string;
  linkMantenimientoId?: string;
  linkMantenimientoTipo?: string;
  registrarTrazabilidad?: boolean;
};

export async function subirArchivosAction(formData: FormData): Promise<ArchivoAdjunto[]> {
  const { usuario } = await requireSession();
  const metaRaw = formData.get("meta");
  if (typeof metaRaw !== "string") {
    throw new Error("Metadata de subida inválida");
  }
  const meta = JSON.parse(metaRaw) as SubirArchivosMeta;
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return [];

  return subirArchivosPersistidos(files, {
    bucket: meta.bucket,
    entidadTipo: meta.entidadTipo,
    entidadId: meta.entidadId,
    contratoId: meta.contratoId,
    inmuebleId: meta.inmuebleId,
    linkContratoId: meta.linkContratoId,
    linkMantenimiento: meta.linkMantenimientoId
      ? { id: meta.linkMantenimientoId, tipoDocumento: meta.linkMantenimientoTipo }
      : undefined,
    usuarioId: usuario.id,
    cargadoPor: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rolActivo ?? usuario.rol,
    },
    registrarTrazabilidad: meta.registrarTrazabilidad,
  });
}

export async function obtenerUrlArchivoAction(
  adjunto: ArchivoAdjunto
): Promise<string | null> {
  await requireSession();
  if (adjunto.bucket && adjunto.path) {
    const signed = await getSignedUrl(adjunto.bucket, adjunto.path);
    if (signed) return signed;
  }
  return resolveArchivoUrl(adjunto);
}

export async function eliminarArchivoAction(
  adjunto: ArchivoAdjunto,
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string
): Promise<boolean> {
  await requireSession();
  return eliminarArchivoAdjunto(adjunto, { entidadTipo, entidadId });
}

export async function listarArchivosEntidadAction(
  entidadTipo: EntidadTipoTrazabilidad,
  entidadId: string
): Promise<ArchivoAdjunto[]> {
  await requireSession();
  return getFileRepository().findByEntidad(entidadTipo, entidadId);
}
