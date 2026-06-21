import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export function publicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  // Works for private buckets when storage.objects SELECT policy allows anon.
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadFile(bucket: string, file: File, prefix = ""): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${prefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function removeFile(bucket: string, path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
