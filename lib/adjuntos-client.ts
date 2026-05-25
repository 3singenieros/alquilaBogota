"use client";

import {
  subirArchivosAction,
  type SubirArchivosMeta,
} from "@/app/actions/file-storage.actions";
import { isMockMode } from "@/config/app-mode";
import type { ArchivoAdjunto } from "@/types";

export type UploadContext = SubirArchivosMeta;

/** Archivo aún no persistido en Storage (solo metadata local). */
export function esAdjuntoPendienteSubida(a: ArchivoAdjunto): boolean {
  return !a.bucket && !a.path;
}

export function adjuntosYaSubidos(adjuntos: ArchivoAdjunto[]): ArchivoAdjunto[] {
  return adjuntos.filter((a) => !esAdjuntoPendienteSubida(a));
}

export async function subirArchivosCliente(
  files: File[],
  meta: UploadContext
): Promise<ArchivoAdjunto[]> {
  if (files.length === 0) return [];
  if (isMockMode()) return [];

  const fd = new FormData();
  fd.append("meta", JSON.stringify(meta));
  for (const file of files) {
    fd.append("files", file);
  }
  return subirArchivosAction(fd);
}

/** Sube archivos pendientes tras crear la entidad y combina con los ya subidos. */
export async function subirAdjuntosTrasCrear(
  existentes: ArchivoAdjunto[],
  pendingFiles: File[],
  meta: UploadContext
): Promise<ArchivoAdjunto[]> {
  const subidos = adjuntosYaSubidos(existentes);
  if (pendingFiles.length === 0) return subidos;
  const nuevos = await subirArchivosCliente(pendingFiles, meta);
  return [...subidos, ...nuevos];
}

export async function subirYVincularPostCreate(
  entityId: string,
  pendingFiles: File[],
  uploadMeta: Omit<UploadContext, "entidadId">,
  vincular: (id: string, adjuntos: ArchivoAdjunto[]) => Promise<unknown>
): Promise<ArchivoAdjunto[]> {
  if (pendingFiles.length === 0) return [];
  const adjuntos = await subirArchivosCliente(pendingFiles, {
    ...uploadMeta,
    entidadId: entityId,
  });
  if (adjuntos.length > 0) {
    await vincular(entityId, adjuntos);
  }
  return adjuntos;
}
