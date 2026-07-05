import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { uploadFile, removeFile, signedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Ad = {
  id: string;
  image_url: string;
  link_url: string;
  audience: "hombres" | "damas" | "both";
  is_active: boolean;
  position: number;
};

const BUCKET = "promo-images";
const MAX_ADS = 3;
const TARGET_W = 1600;
const TARGET_H = 900; // 16:9

async function normalizeTo16x9(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const srcRatio = bitmap.width / bitmap.height;
  const dstRatio = TARGET_W / TARGET_H;
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (srcRatio > dstRatio) {
    // recorta laterales
    sw = bitmap.height * dstRatio;
    sx = (bitmap.width - sw) / 2;
  } else {
    // recorta arriba/abajo
    sh = bitmap.width / dstRatio;
    sy = (bitmap.height - sh) / 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
  bitmap.close?.();
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo procesar la imagen"))), "image/jpeg", 0.85)
  );
  return new File([blob], "ad.jpg", { type: "image/jpeg" });
}

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_slots")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setAds((data ?? []) as Ad[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addSlot() {
    if (ads.length >= MAX_ADS) { toast.error(`Máximo ${MAX_ADS} espacios`); return; }
    setCreating(true);
    const used = new Set(ads.map((a) => a.position));
    let pos = 1;
    while (used.has(pos) && pos <= MAX_ADS) pos++;
    const { error } = await supabase.from("promo_slots").insert({
      image_url: "", link_url: "https://", audience: "both",
      is_active: false, position: pos,
    });
    setCreating(false);
    if (error) { console.error(error); toast.error(error.message); return; }
    toast.success("Espacio creado");
    load();
  }

  async function updateAd(id: string, patch: Partial<Ad>) {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const { error } = await supabase.from("promo_slots").update(patch).eq("id", id);
    if (error) { console.error(error); toast.error(error.message); load(); }
  }

  async function deleteAd(ad: Ad) {
    if (!confirm("¿Eliminar este espacio?")) return;
    const { error } = await supabase.from("promo_slots").delete().eq("id", ad.id);
    if (error) { console.error(error); toast.error(error.message); return; }
    if (ad.image_url) {
      try { await removeFile(BUCKET, ad.image_url); } catch (e) { console.error(e); }
    }
    toast.success("Eliminado");
    setAds((prev) => prev.filter((a) => a.id !== ad.id));
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-2xl md:text-3xl font-bold uppercase tracking-widest">Espacios publicitarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hasta {MAX_ADS} espacios al final de la lista de ejercicios. Las imágenes se recortan a 16:9.
          </p>
        </div>
        <Button
          onClick={addSlot}
          disabled={creating || ads.length >= MAX_ADS}
          className="bg-yellow text-ink hover:bg-yellow/90 font-bold"
        >
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground">
          Todavía no hay espacios cargados. Presioná “Agregar”.
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <AdRow key={ad.id} ad={ad} onUpdate={(p) => updateAd(ad.id, p)} onDelete={() => deleteAd(ad)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdImage({
  value, onChange,
}: {
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancel = false;
    signedUrl(BUCKET, value).then((u) => { if (!cancel) setUrl(u); });
    return () => { cancel = true; };
  }, [value]);


  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Subí una imagen"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Máx 10MB"); return; }
    setBusy(true);
    try {
      const normalized = await normalizeTo16x9(file);
      const old = value;
      const path = await uploadFile(BUCKET, normalized);
      onChange(path);
      if (old) { try { await removeFile(BUCKET, old); } catch (e) { console.error(e); } }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error al subir la imagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    const old = value;
    onChange(null);
    if (old) { try { await removeFile(BUCKET, old); } catch (err) { console.error(err); } }
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Imagen (16:9)
      </div>
      <div
        className={cn(
          "relative aspect-[16/9] rounded-xl border-2 border-dashed bg-surface overflow-hidden",
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
            onClick={handleRemove}
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

function AdRow({
  ad, onUpdate, onDelete,
}: {
  ad: Ad;
  onUpdate: (patch: Partial<Ad>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 md:p-6 grid md:grid-cols-[280px_1fr_auto] gap-5">
      <AdImage
        value={ad.image_url || null}
        onChange={(path) => onUpdate({ image_url: path ?? "" })}
      />

      <div className="space-y-3 min-w-0">
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Link destino</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={ad.link_url}
              onChange={(e) => onUpdate({ link_url: e.target.value })}
              placeholder="https://instagram.com/…"
            />
            {ad.link_url && (
              <a
                href={ad.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-border hover:bg-surface"
                aria-label="Abrir link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Audiencia</Label>
            <Select value={ad.audience} onValueChange={(v) => onUpdate({ audience: v as Ad["audience"] })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hombres">Hombres</SelectItem>
                <SelectItem value="damas">Damas</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Posición</Label>
            <Select value={String(ad.position)} onValueChange={(v) => onUpdate({ position: Number(v) })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={ad.is_active}
              onCheckedChange={(v) => {
                if (v && !ad.image_url) { toast.error("Subí una imagen antes de activar"); return; }
                if (v && !ad.link_url) { toast.error("Cargá un link antes de activar"); return; }
                onUpdate({ is_active: v });
              }}
            />
            <span className="text-sm font-medium">{ad.is_active ? "Activo" : "Inactivo"}</span>
          </label>
          {!ad.image_url && <span className="text-xs text-muted-foreground">Falta imagen</span>}
        </div>
      </div>

      <div className="flex md:flex-col items-start gap-2">
        <Button variant="outline" size="icon" onClick={onDelete} aria-label="Eliminar">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
