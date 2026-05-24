import { isMockMode } from "@/config/app-mode";
import { STORAGE_BUCKETS, type StorageBucketKey } from "@/lib/config";
import { getSupabase } from "@/lib/supabase/helpers";
import { STORAGE_PATHS } from "@/lib/supabase/storage-paths";
import type { ArchivoAdjunto } from "@/types";

export type FileUploadInput = {
  bucket: StorageBucketKey;
  path: string;
  file: File;
  uploadedBy?: string;
  descripcion?: string;
};

export type FileUploadResult = {
  bucket: string;
  path: string;
  publicUrl: string | null;
  adjunto: ArchivoAdjunto;
};

/**
 * Abstracción de Storage: mock simula URL; Supabase sube al bucket real.
 * Upload completo se activará en fase 2 de migración.
 */
export async function uploadArchivo(input: FileUploadInput): Promise<FileUploadResult | null> {
  const now = new Date().toISOString();

  if (isMockMode()) {
    const adjunto: ArchivoAdjunto = {
      id: `adj-mock-${Date.now()}`,
      nombre: input.file.name,
      tipo: input.file.type,
      tamano: input.file.size,
      urlSimulada: `archivo:${input.file.name}`,
      bucket: STORAGE_BUCKETS[input.bucket],
      path: input.path,
      uploadedAt: now,
      uploadedBy: input.uploadedBy,
      descripcion: input.descripcion,
      fechaCarga: now,
      cargadoPorId: input.uploadedBy,
    };
    return {
      bucket: STORAGE_BUCKETS[input.bucket],
      path: input.path,
      publicUrl: null,
      adjunto,
    };
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  const bucketName = STORAGE_BUCKETS[input.bucket];
  const { error } = await supabase.storage.from(bucketName).upload(input.path, input.file, {
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(input.path);
  const adjunto: ArchivoAdjunto = {
    id: `adj-${Date.now()}`,
    nombre: input.file.name,
    tipo: input.file.type,
    tamano: input.file.size,
    bucket: bucketName,
    path: input.path,
    publicUrl: data.publicUrl,
    uploadedAt: now,
    uploadedBy: input.uploadedBy,
    descripcion: input.descripcion,
    fechaCarga: now,
    cargadoPorId: input.uploadedBy,
  };

  return { bucket: bucketName, path: input.path, publicUrl: data.publicUrl, adjunto };
}

export async function getArchivoPublicUrl(
  bucket: StorageBucketKey,
  path: string
): Promise<string | null> {
  if (isMockMode()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = supabase.storage.from(STORAGE_BUCKETS[bucket]).getPublicUrl(path);
  return data.publicUrl;
}

export { STORAGE_PATHS, STORAGE_BUCKETS };
