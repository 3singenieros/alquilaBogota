import { STORAGE_BUCKETS, type StorageBucketKey } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase/client";

export type StorageBucket = StorageBucketKey;

/** @deprecated Usar services/file-storage.service.ts */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const bucketName = STORAGE_BUCKETS[bucket];
  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
}
