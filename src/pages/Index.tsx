import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Play, LogIn, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { publicUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import VideoPlayerDialog from "@/components/VideoPlayerDialog";
import { Button } from "@/components/ui/button";

type Gender = "hombres" | "damas";
type Routine = {
  id: string; gender: Gender; level: number; name: string;
  description: string | null; cover_image_url: string | null;
  days_count: number; is_published: boolean;
};
type Exercise = {
  id: string; routine_id: string; day: number; position: number;
  title: string; repetitions: string | null; tip: string | null; cover_image_url: string | null;
  video_type: "youtube" | "upload" | "none"; youtube_id: string | null; video_url: string | null;
};

const LEVELS = [1, 2, 3, 4, 5, 6, 7];

export default function Index() {
  const { user, isAdmin, signOut } = useAuth();
  const [gender, setGender] = useState<Gender>("hombres");
  const [level, setLevel] = useState(1);
  const [day, setDay] = useState(1);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<Exercise | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: routines, error: routineError } = await supabase
        .from("routines")
        .select("*")
        .eq("gender", gender).eq("level", level)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(1);

      if (cancel) return;

      if (routineError) {
        console.error("Error loading routine", routineError);
        setRoutine(null);
        setExercises([]);
        setLoading(false);
        return;
      }

      const r = (routines?.[0] as Routine | undefined) ?? null;
      setRoutine(r);
      if (r) {
        const { data: ex, error: exercisesError } = await supabase
          .from("exercises").select("*")
          .eq("routine_id", r.id).order("day").order("position");
        if (exercisesError) console.error("Error loading exercises", exercisesError);
        if (!cancel) setExercises((ex ?? []) as Exercise[]);
      } else {
        setExercises([]);
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [gender, level]);

  useEffect(() => { if (routine && day > routine.days_count) setDay(1); }, [routine, day]);

  const dayExercises = useMemo(
    () => exercises.filter((e) => e.day === day).sort((a, b) => a.position - b.position),
    [exercises, day]
  );

  const dayTabs = routine ? Array.from({ length: routine.days_count }, (_, i) => i + 1) : [1];

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 bg-ink text-white">
        <div className="flex items-center h-14 md:h-16 px-4 md:px-8">
          <h1 className="text-display text-xl md:text-2xl font-bold tracking-widest">RUTINAS</h1>
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Button>
              </Link>
            )}
            {user ? (
              <Button size="sm" variant="ghost" onClick={signOut} className="text-white hover:bg-white/10 hover:text-white">Salir</Button>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-yellow text-ink hover:bg-yellow/90 font-bold">
                  <LogIn className="h-4 w-4" /> Iniciar sesión
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
        <section className="space-y-4 mb-8">
          <Segmented label="Grupo" options={[{ value: "hombres", label: "HOMBRES" }, { value: "damas", label: "DAMAS" }]} value={gender} onChange={(v) => setGender(v as Gender)} />
          <div>
            <MicroLabel>Nivel</MicroLabel>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <Pill key={lv} active={level === lv} onClick={() => setLevel(lv)}>{lv}</Pill>
              ))}
            </div>
          </div>
          {routine && routine.days_count > 1 && (
            <Segmented label="Día" options={dayTabs.map((d) => ({ value: String(d), label: `DÍA ${d}` }))} value={String(day)} onChange={(v) => setDay(Number(v))} />
          )}
        </section>

        {routine && (
          <div className="mb-5">
            <h2 className="text-display text-2xl md:text-3xl font-bold uppercase">{routine.name}</h2>
            {routine.description && <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>}
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              {dayExercises.length} ejercicio{dayExercises.length === 1 ? "" : "s"}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground">Cargando…</div>
        ) : !routine ? (
          <EmptyState />
        ) : dayExercises.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground">
            Aún no hay ejercicios cargados para este día.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {dayExercises.map((ex, i) => (
              <ExerciseCard key={ex.id} index={i + 1} ex={ex} onPlay={() => setPlaying(ex)} />
            ))}
          </div>
        )}

        <footer className="mt-12 pb-8 text-center text-xs text-muted-foreground uppercase tracking-widest">
          Entrena con foco · Sin distracciones
        </footer>
      </main>

      <VideoPlayerDialog
        open={!!playing}
        onOpenChange={(o) => !o && setPlaying(null)}
        title={playing?.title ?? ""}
        videoType={playing?.video_type ?? "none"}
        youtubeId={playing?.youtube_id}
        videoUrl={playing?.video_url}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-border p-10 text-center">
      <h3 className="text-display text-xl font-bold uppercase">Sin rutina disponible</h3>
      <p className="text-sm text-muted-foreground mt-2">Todavía no hay una rutina publicada para esta combinación.</p>
    </div>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{children}</div>;
}

function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <MicroLabel>{label}</MicroLabel>
      <div className="inline-flex bg-white rounded-full p-1 border border-border shadow-sm flex-wrap">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button key={o.value} onClick={() => onChange(o.value)} className={cn("px-5 py-2 text-sm font-bold tracking-wider rounded-full transition-all", active ? "bg-yellow text-ink" : "text-muted-foreground hover:text-ink")}>{o.label}</button>
          );
        })}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("h-10 min-w-10 px-4 rounded-full text-sm font-bold transition-all border", active ? "bg-yellow border-yellow text-ink shadow-sm" : "bg-white border-border text-ink hover:border-ink")}>{children}</button>
  );
}

function ExerciseCard({ index, ex, onPlay }: { index: number; ex: Exercise; onPlay: () => void }) {
  const img = publicUrl("exercise-covers", ex.cover_image_url);
  const hasVideo = ex.video_type !== "none";
  const repetitions = ex.repetitions?.trim();

  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
      <div className="relative aspect-video bg-ink overflow-hidden">
        {img ? (
          <img src={img} alt={ex.title} loading="lazy" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink to-ink/70" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-3 left-3 bg-yellow text-ink text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
          #{String(index).padStart(2, "0")}
        </span>
        {hasVideo && (
          <button aria-label={`Reproducir ${ex.title}`} onClick={onPlay} className="absolute inset-0 flex items-center justify-center group">
            <span className="h-14 w-14 rounded-full bg-yellow flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-ink fill-ink ml-0.5" />
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-display font-bold text-lg uppercase text-ink leading-tight">{ex.title}</h3>
        {repetitions && (
          <div className="mt-3 rounded-xl bg-ink px-4 py-3 text-white">
            <div className="text-[10px] font-bold uppercase tracking-widest text-yellow">Repeticiones</div>
            <div className="mt-1 text-display text-2xl font-bold leading-none">{repetitions}</div>
          </div>
        )}
        {ex.tip && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{ex.tip}</p>}
      </div>
    </article>
  );
}
