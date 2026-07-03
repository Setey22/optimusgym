import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ImageUploader from "@/components/ImageUploader";
import { publicUrl } from "@/lib/media";

type Ad = {
  id: string;
  image_url: string;
  link_url: string;
  audience: "hombres" | "damas" | "both";
  is_active: boolean;
  position: number;
};

const BUCKET = "ad-images";
const MAX_ADS = 3;

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setAds((data ?? []) as Ad[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addSlot() {
    if (ads.length >= MAX_ADS) {
      toast.error(`Máximo ${MAX_ADS} espacios`);
      return;
    }
    setCreating(true);
    const usedPositions = new Set(ads.map((a) => a.position));
    let pos = 1;
    while (usedPositions.has(pos) && pos <= MAX_ADS) pos++;
    const { error } = await supabase.from("ads").insert({
      image_url: "",
      link_url: "https://",
      audience: "both",
      is_active: false,
      position: pos,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Espacio creado");
    load();
  }

  async function updateAd(id: string, patch: Partial<Ad>) {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    const { error } = await supabase.from("ads").update(patch).eq("id", id);
    if (error) { toast.error(error.message); load(); }
  }

  async function deleteAd(id: string) {
    if (!confirm("¿Eliminar este espacio?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminado");
    setAds((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-2xl md:text-3xl font-bold uppercase tracking-widest">Espacios publicitarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hasta {MAX_ADS} espacios que aparecen al final de la lista de ejercicios.
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
            <AdRow key={ad.id} ad={ad} onUpdate={(p) => updateAd(ad.id, p)} onDelete={() => deleteAd(ad.id)} />
          ))}
        </div>
      )}
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
  const preview = publicUrl(BUCKET, ad.image_url);
  return (
    <div className="bg-white rounded-2xl border border-border p-4 md:p-6 grid md:grid-cols-[280px_1fr_auto] gap-5">
      <div>
        <ImageUploader
          bucket={BUCKET}
          value={ad.image_url || null}
          onChange={(path) => onUpdate({ image_url: path ?? "" })}
          label={`Imagen (posición ${ad.position})`}
        />
      </div>

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
                if (v && !ad.image_url) {
                  toast.error("Subí una imagen antes de activar");
                  return;
                }
                if (v && !ad.link_url) {
                  toast.error("Cargá un link antes de activar");
                  return;
                }
                onUpdate({ is_active: v });
              }}
            />
            <span className="text-sm font-medium">{ad.is_active ? "Activo" : "Inactivo"}</span>
          </label>
          {!preview && <span className="text-xs text-muted-foreground">Falta imagen</span>}
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
