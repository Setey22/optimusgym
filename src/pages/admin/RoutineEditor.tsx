import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import ExerciseEditor from "./ExerciseEditor";
import { publicUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Routine = {
  id: string; gender: "hombres" | "damas"; level: number; name: string;
  description: string | null; cover_image_url: string | null;
  days_count: number; is_published: boolean;
};
type Exercise = {
  id: string; routine_id: string; day: number; position: number;
  title: string; tip: string | null; cover_image_url: string | null;
  video_type: "youtube" | "upload" | "none"; youtube_id: string | null; video_url: string | null;
};

export default function RoutineEditor() {
  const { id } = useParams();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!id) return;
    const [{ data: r }, { data: ex }] = await Promise.all([
      supabase.from("routines").select("*").eq("id", id).single(),
      supabase.from("exercises").select("*").eq("routine_id", id).order("day").order("position"),
    ]);
    if (r) setRoutine(r as Routine);
    if (ex) setExercises(ex as Exercise[]);
  }
  useEffect(() => { load(); }, [id]);

  async function saveRoutine() {
    if (!routine) return;
    setSaving(true);
    const { error } = await supabase.from("routines").update({
      name: routine.name, description: routine.description,
      gender: routine.gender, level: routine.level,
      days_count: routine.days_count, is_published: routine.is_published,
      cover_image_url: routine.cover_image_url,
    }).eq("id", routine.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Guardado");
  }

  async function addExercise() {
    if (!routine) return;
    const dayExercises = exercises.filter((e) => e.day === activeDay);
    const { data, error } = await supabase.from("exercises").insert({
      routine_id: routine.id, day: activeDay, position: dayExercises.length,
      title: "Nuevo ejercicio", video_type: "none",
    }).select("*").single();
    if (error) { toast.error(error.message); return; }
    setExercises((p) => [...p, data as Exercise]);
    setEditing(data as Exercise);
  }

  async function removeExercise(ex: Exercise) {
    if (!confirm("¿Eliminar ejercicio?")) return;
    const { error } = await supabase.from("exercises").delete().eq("id", ex.id);
    if (error) toast.error(error.message); else setExercises((p) => p.filter((e) => e.id !== ex.id));
  }

  async function move(ex: Exercise, dir: -1 | 1) {
    const dayEx = exercises.filter((e) => e.day === ex.day).sort((a, b) => a.position - b.position);
    const idx = dayEx.findIndex((e) => e.id === ex.id);
    const swap = dayEx[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("exercises").update({ position: swap.position }).eq("id", ex.id),
      supabase.from("exercises").update({ position: ex.position }).eq("id", swap.id),
    ]);
    load();
  }

  if (!routine) return <div className="p-8 text-muted-foreground">Cargando…</div>;

  const dayExercises = exercises.filter((e) => e.day === activeDay).sort((a, b) => a.position - b.position);
  const dayTabs = Array.from({ length: routine.days_count }, (_, i) => i + 1);
  if (activeDay > routine.days_count) setTimeout(() => setActiveDay(1), 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-4">
        <ArrowLeft className="h-4 w-4" /> Rutinas
      </Link>

      <div className="bg-white rounded-2xl p-6 border border-border mb-6">
        <div className="grid md:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={routine.name} onChange={(e) => setRoutine({ ...routine, name: e.target.value })} />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={3} value={routine.description ?? ""} onChange={(e) => setRoutine({ ...routine, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Género</Label>
                <select value={routine.gender} onChange={(e) => setRoutine({ ...routine, gender: e.target.value as any })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="hombres">Hombres</option><option value="damas">Damas</option>
                </select>
              </div>
              <div>
                <Label>Nivel</Label>
                <select value={routine.level} onChange={(e) => setRoutine({ ...routine, level: Number(e.target.value) })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {[1,2,3,4,5,6,7].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <Label>Días</Label>
                <select value={routine.days_count} onChange={(e) => setRoutine({ ...routine, days_count: Number(e.target.value) })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface rounded-md px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Publicada</div>
                <div className="text-xs text-muted-foreground">Visible para los visitantes</div>
              </div>
              <Switch checked={routine.is_published} onCheckedChange={(v) => setRoutine({ ...routine, is_published: v })} />
            </div>
            <Button onClick={saveRoutine} disabled={saving} className="bg-ink text-white hover:bg-ink/90">
              <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar rutina"}
            </Button>
          </div>
          <ImageUploader
            bucket="routine-covers"
            value={routine.cover_image_url}
            onChange={(p) => setRoutine({ ...routine, cover_image_url: p })}
            label="Portada"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {dayTabs.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors",
              activeDay === d ? "bg-ink text-white" : "bg-white border border-border hover:border-ink"
            )}
          >Día {d}</button>
        ))}
        <div className="ml-auto"><Button onClick={addExercise} className="bg-yellow text-ink hover:bg-yellow/90 font-bold"><Plus className="h-4 w-4"/> Ejercicio</Button></div>
      </div>

      {dayExercises.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">Sin ejercicios en este día.</div>
      ) : (
        <ul className="space-y-2">
          {dayExercises.map((ex, i) => {
            const img = publicUrl("exercise-covers", ex.cover_image_url);
            return (
              <li key={ex.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="w-20 h-14 bg-surface rounded-md overflow-hidden flex-shrink-0">
                  {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">#{i + 1} · {ex.video_type === "none" ? "Sin video" : ex.video_type}</div>
                  <div className="font-semibold truncate">{ex.title}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => move(ex, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4"/></Button>
                <Button size="icon" variant="ghost" onClick={() => move(ex, 1)} disabled={i === dayExercises.length - 1}><ArrowDown className="h-4 w-4"/></Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(ex)}>Editar</Button>
                <Button size="icon" variant="ghost" onClick={() => removeExercise(ex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ExerciseEditor
          exercise={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
