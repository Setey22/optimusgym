import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import { parseYouTubeId } from "@/lib/youtube";
import { uploadFile, removeFile } from "@/lib/media";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Exercise = {
  id: string; routine_id: string; day: number; position: number;
  title: string; repetitions: string | null; tip: string | null; cover_image_url: string | null;
  video_type: "youtube" | "upload" | "none"; youtube_id: string | null; video_url: string | null;
};

export default function ExerciseEditor({
  exercise, onClose, onSaved,
}: { exercise: Exercise; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Exercise>(exercise);
  const [ytInput, setYtInput] = useState(exercise.youtube_id ?? "");
  const [saving, setSaving] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);

  async function handleVideoFile(file: File) {
    if (!file.type.startsWith("video/")) { toast.error("Subí un video"); return; }
    if (file.size > 200 * 1024 * 1024) { toast.error("Máx 200MB"); return; }
    setVideoBusy(true);
    try {
      const old = form.video_url;
      const path = await uploadFile("exercise-videos", file);
      setForm({ ...form, video_url: path, video_type: "upload" });
      if (old) await removeFile("exercise-videos", old);
    } catch (e: any) { toast.error(e.message); }
    finally { setVideoBusy(false); }
  }

  async function save() {
    let payload: any = {
      title: form.title,
      repetitions: form.repetitions?.trim() || null,
      tip: form.tip,
      cover_image_url: form.cover_image_url,
      video_type: form.video_type,
      youtube_id: null, video_url: form.video_url,
    };
    if (form.video_type === "youtube") {
      const id = parseYouTubeId(ytInput);
      if (!id) { toast.error("Link de YouTube inválido"); return; }
      payload.youtube_id = id; payload.video_url = null;
    } else if (form.video_type === "none") {
      payload.video_url = null;
    }
    setSaving(true);
    const { error } = await supabase.from("exercises").update(payload).eq("id", form.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Guardado"); onSaved(); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-display text-xl uppercase tracking-widest">Ejercicio</DialogTitle>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Repeticiones / tiempo</Label>
            <Input
              value={form.repetitions ?? ""}
              onChange={(e) => setForm({ ...form, repetitions: e.target.value })}
              placeholder="Ej: 4 x 15 o 4 x 20 seg"
            />
          </div>
          <div>
            <Label>Tip / instrucción</Label>
            <Textarea rows={3} value={form.tip ?? ""} onChange={(e) => setForm({ ...form, tip: e.target.value })} />
          </div>
          <ImageUploader
            bucket="exercise-covers"
            value={form.cover_image_url}
            onChange={(p) => setForm({ ...form, cover_image_url: p })}
            label="Foto de portada"
          />

          <div>
            <Label>Video</Label>
            <div className="flex gap-2 flex-wrap">
              {(["none", "youtube", "upload"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, video_type: t })}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border",
                    form.video_type === t ? "bg-ink text-white border-ink" : "bg-white border-border"
                  )}
                >{t === "none" ? "Sin video" : t === "youtube" ? "YouTube" : "Subir archivo"}</button>
              ))}
            </div>
          </div>

          {form.video_type === "youtube" && (
            <div>
              <Label>Link o ID de YouTube</Label>
              <Input value={ytInput} onChange={(e) => setYtInput(e.target.value)} placeholder="https://youtu.be/..." />
              <p className="text-xs text-muted-foreground mt-1">Recomendado: subir el video como <strong>no listado</strong> en YouTube.</p>
            </div>
          )}

          {form.video_type === "upload" && (
            <div>
              <label className={cn(
                "block aspect-video rounded-xl border-2 border-dashed bg-surface relative overflow-hidden cursor-pointer",
                "flex items-center justify-center hover:border-ink/40"
              )}>
                {form.video_url ? (
                  <video src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/exercise-videos/${form.video_url}`} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-xs">Click para subir video (máx 200MB)</div>
                  </div>
                )}
                {videoBusy && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-6 w-6 text-white animate-spin"/></div>}
                <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); e.target.value = ""; }} />
              </label>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="bg-yellow text-ink hover:bg-yellow/90 font-bold">
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
