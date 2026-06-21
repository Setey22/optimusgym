import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadFile, publicUrl, removeFile } from "@/lib/media";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ImageUploader({
  bucket, value, onChange, label = "Imagen",
}: {
  bucket: string;
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const url = publicUrl(bucket, value);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Subí una imagen"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    setBusy(true);
    try {
      const old = value;
      const path = await uploadFile(bucket, file);
      onChange(path);
      if (old) await removeFile(bucket, old);
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div
        className={cn(
          "relative aspect-video rounded-xl border-2 border-dashed bg-surface overflow-hidden",
          "flex items-center justify-center cursor-pointer hover:border-ink/40 transition-colors"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-muted-foreground">
            <Upload className="h-6 w-6 mx-auto mb-1" />
            <div className="text-xs">Click para subir</div>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        {url && !busy && (
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              const old = value;
              onChange(null);
              if (old) await removeFile(bucket, old);
            }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
            aria-label="Quitar imagen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}
