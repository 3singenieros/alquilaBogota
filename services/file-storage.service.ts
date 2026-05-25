import { isMockMode } from "@/config/app-mode";
import { STORAGE_BUCKETS, type StorageBucketKey } from "@/lib/config";
import { requireSupabase } from "@/lib/supabase/helpers";
import { buildStorageObjectPath } from "@/lib/supabase/storage-paths";
import type { ArchivoAdjunto } from "@/types";
import type { EntidadTipoTrazabilidad } from "@/types/trazabilidad";

export type FileUploadOptions = {
  bucket: StorageBucketKey;
  entidadTipo: EntidadTipoTrazabilidad | string;
  entidadId: string;
  contratoId?: string;
  inmuebleId?: string;
  usuarioId?: string;
  descripcion?: string;
  cargadoPorNombre?: string;
  cargadoPorEmail?: string;
  cargadoPorRol?: ArchivoAdjunto["cargadoPorRol"];
};

export type FileUploadInput = FileUploadOptions & {
  file: File | Blob;
  filename?: string;
  contentType?: string;
};

export type FileUploadResult = {
  bucket: string;
  path: string;
  publicUrl: string | null;
  signedUrl: string | null;
  adjunto: ArchivoAdjunto;
};

const SIGNED_URL_TTL_SEC = 3600;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildAdjuntoFromUpload(
  input: FileUploadInput,
  bucketName: string,
  path: string,
  publicUrl: string | null,
  id?: string
): ArchivoAdjunto {
  const now = new Date().toISOString();
  const nombre = input.filename ?? (input.file instanceof File ? input.file.name : "archivo");
  const tipo =
    input.contentType ??
    (input.file instanceof File ? input.file.type : undefined) ??
    undefined;
  const tamano = input.file.size;

  return {
    id: id ?? `adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nombre,
    tipo,
    tamano,
    bucket: bucketName,
    path,
    publicUrl: publicUrl ?? undefined,
    uploadedAt: now,
    uploadedBy: input.usuarioId,
    descripcion: input.descripcion,
    fechaCarga: now,
    cargadoPorId: input.usuarioId,
    cargadoPorNombre: input.cargadoPorNombre,
    cargadoPorEmail: input.cargadoPorEmail,
    cargadoPorRol: input.cargadoPorRol,
  };
}

export async function uploadFile(input: FileUploadInput): Promise<FileUploadResult> {
  const bucketName = STORAGE_BUCKETS[input.bucket];
  const filename = sanitizeFilename(
    input.filename ?? (input.file instanceof File ? input.file.name : "archivo")
  );
  const path =
    input.entidadTipo && input.entidadId
      ? buildStorageObjectPath({
          entidadTipo: input.entidadTipo,
          entidadId: input.entidadId,
          filename,
        })
      : filename;

  if (isMockMode()) {
    const adjunto = buildAdjuntoFromUpload(input, bucketName, path, null);
    adjunto.urlSimulada = `archivo:${filename}`;
    return { bucket: bucketName, path, publicUrl: null, signedUrl: null, adjunto };
  }

  const sb = requireSupabase();
  const { error } = await sb.storage.from(bucketName).upload(path, input.file, {
    upsert: true,
    contentType:
      input.contentType ?? (input.file instanceof File ? input.file.type : undefined),
  });
  if (error) throw error;

  const { data: publicData } = sb.storage.from(bucketName).getPublicUrl(path);
  const signedUrl = await getSignedUrl(bucketName, path);

  const adjunto = buildAdjuntoFromUpload(
    input,
    bucketName,
    path,
    publicData.publicUrl || signedUrl
  );

  return {
    bucket: bucketName,
    path,
    publicUrl: publicData.publicUrl,
    signedUrl,
    adjunto,
  };
}

export async function uploadMultipleFiles(
  files: (File | Blob)[],
  options: FileUploadOptions & { filenames?: string[] }
): Promise<FileUploadResult[]> {
  const results: FileUploadResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    results.push(
      await uploadFile({
        ...options,
        file,
        filename: options.filenames?.[i] ?? (file instanceof File ? file.name : `archivo-${i + 1}`),
      })
    );
  }
  return results;
}

export function getPublicUrl(bucket: string, path: string): string | null {
  if (isMockMode()) return null;
  const sb = requireSupabase();
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSec = SIGNED_URL_TTL_SEC
): Promise<string | null> {
  if (isMockMode()) return null;
  const sb = requireSupabase();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  if (isMockMode()) return true;
  const sb = requireSupabase();
  const { error } = await sb.storage.from(bucket).remove([path]);
  return !error;
}

/** Resuelve URL para visualizar (signed > public > simulada). */
export async function resolveArchivoUrl(adjunto: ArchivoAdjunto): Promise<string | null> {
  if (adjunto.publicUrl?.startsWith("http")) return adjunto.publicUrl;
  if (adjunto.bucket && adjunto.path) {
    const signed = await getSignedUrl(adjunto.bucket, adjunto.path);
    if (signed) return signed;
    return getPublicUrl(adjunto.bucket, adjunto.path);
  }
  if (adjunto.urlSimulada?.startsWith("http")) return adjunto.urlSimulada;
  return null;
}

export { STORAGE_BUCKETS, buildStorageObjectPath };
