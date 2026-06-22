import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Menu, Play, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { publicUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import VideoPlayerDialog from "@/components/VideoPlayerDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
const MIN_PUBLIC_DAYS = 2;

const DAY_2_PRESET = [
  { title: "Subidas al step", repetitions: "4x20", youtube_id: "d7NnSFMIdgA" },
  { title: "Abdomen cruzados", repetitions: "4x12", youtube_id: "yi9t1VFN3JU" },
  { title: "Elevación piernas", repetitions: "4x12", youtube_id: "l_N4S4S68Sg" },
  { title: "Hombros trapecios encogimiento", repetitions: "4x12", youtube_id: "gT8CenL_g7g" },
  { title: "Vuelos laterales sentado", repetitions: "3x12", youtube_id: "Kz6_L7_X_uM" },
  { title: "Vuelos frontales con disco", repetitions: "4x12", youtube_id: "E8SOnX7pccI" },
  { title: "Tríceps 1 mano extensión", repetitions: "4x10", youtube_id: "u8w3Us_FWb4" },
  { title: "Espalda remo 1 mano", repetitions: "4x10", youtube_id: "own3uEE4wP8" },
  { title: "Espalda remo Dorian", repetitions: "4x10", youtube_id: "Zf0g-A_yN9k" },
  { title: "Bailarina (aductor)", repetitions: "4x10", youtube_id: "F0S1_WvM58s" },
  { title: "Pecho Hamer 45º", repetitions: "3x10", youtube_id: "hkU6fSHcslw" },
  { title: "Bíceps sentado con mancuernas", repetitions: "4x12", youtube_id: "DUTcx5B-ddk" },
];

function buildDayTwoPresetExercises(routineId: string): Exercise[] {
  return DAY_2_PRESET.map((ex, index) => ({
    id: `day-2-preset-${index + 1}`,
    routine_id: routineId,
    day: 2,
    position: index + 1,
    title: ex.title,
    repetitions: ex.repetitions,
    tip: null,
    cover_image_url: null,
    video_type: "youtube",
    youtube_id: ex.youtube_id,
    video_url: null,
  }));
}

function shouldUsePresetDayTwo(gender: Gender, level: number) {
  return gender === "hombres" && level === 1;
}

export default function Index() {
  const { user, isAdmin, signOut } = useAuth();
  const [gender, setGender] = useState<Gender>("hombres");
  const [level, setLevel] = useState(1);
  const [day, setDay] = useState(1);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Exercise | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setDay(1);
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
        setLoadError("No se pudo cargar la rutina publicada. Revisá los permisos de lectura en Supabase.");
        setLoading(false);
        return;
      }

      const r = (routines?.[0] as Routine | undefined) ?? null;
      setRoutine(r);
      if (r) {
        const { data: ex, error: exercisesError } = await supabase
          .from("exercises").select("*")
          .eq("routine_id", r.id).order("day").order("position");
        if (exercisesError) {
          console.error("Error loading exercises", exercisesError);
          if (!cancel) setLoadError("No se pudieron cargar los ejercicios. Revisá los permisos de lectura en Supabase.");
        }
        if (!cancel) setExercises((ex ?? []) as Exercise[]);
      } else {
        setExercises([]);
      }
      if (!cancel) setLoading(false);
    })();
    return () => { cancel = true; };
  }, [gender, level]);

  const dayTabs = routine
    ? Array.from({ length: Math.max(routine.days_count, MIN_PUBLIC_DAYS) }, (_, i) => i + 1)
    : Array.from({ length: MIN_PUBLIC_DAYS }, (_, i) => i + 1);

  useEffect(() => { if (day > dayTabs.length) setDay(1); }, [day, dayTabs.length]);

  const dayExercises = useMemo(() => {
    if (routine && day === 2 && shouldUsePresetDayTwo(gender, level)) {
      return buildDayTwoPresetExercises(routine.id);
    }

    return exercises
      .filter((e) => e.day === day)
      .sort((a, b) => a.position - b.position);
  }, [exercises, day, routine, gender, level]);

  const summary = `${gender === "hombres" ? "HOMBRES" : "DAMAS"} · NIVEL ${level} · DÍA ${day}`;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-30 bg-ink text-white">
        <div className="flex items-center h-14 md:h-16 px-4 md:px-8 gap-3">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm bg-surface">
              <SheetHeader>
                <SheetTitle className="text-display tracking-widest">FILTROS</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <Segmented label="Grupo" options={[{ value: "hombres", label: "HOMBRES" }, { value: "damas", label: "DAMAS" }]} value={gender} onChange={(v) => setGender(v as Gender)} />
                <div>
                  <MicroLabel>Nivel</MicroLabel>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((lv) => (
                      <Pill key={lv} active={level === lv} onClick={() => setLevel(lv)}>{lv}</Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <MicroLabel>Día</MicroLabel>
                  <div className="flex flex-wrap gap-2">
                    {dayTabs.map((d) => (
                      <Pill key={d} active={day === d} onClick={() => setDay(d)}>Día {d}</Pill>
                    ))}
                  </div>
                </div>
                <Button className="w-full bg-yellow text-ink hover:bg-yellow/90 font-bold" onClick={() => setMenuOpen(false)}>
                  Ver ejercicios
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-display text-xl md:text-2xl font-bold tracking-widest">RUTINAS</h1>
          <div className="ml-auto text-[11px] font-semibold uppercase tracking-widest text-white/60 truncate">
            {summary}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full flex-1">
        {routine && !loading && !loadError && (
          <div className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">
            {dayExercises.length} ejercicio{dayExercises.length === 1 ? "" : "s"}
          </div>
        )}

        {loading ? (
          <div className="text-muted-foreground">Cargando…</div>
        ) : loadError ? (
          <ErrorState message={loadError} />
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
      </main>

      <footer className="mt-12 pb-6 pt-4 text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest space-y-2">
        <div>Entrena con foco · Sin distracciones</div>
        <div className="flex items-center justify-center gap-3">
          {isAdmin ? (
            <>
              <Link to="/admin" className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors">
                <ShieldCheck className="h-3 w-3" /> Admin
              </Link>
              <span>·</span>
              <button onClick={signOut} className="hover:text-muted-foreground transition-colors">Salir</button>
            </>
          ) : user ? (
            <button onClick={signOut} className="hover:text-muted-foreground transition-colors">Salir</button>
          ) : (
            <Link to="/auth" className="hover:text-muted-foreground transition-colors">·</Link>
          )}
        </div>
      </footer>

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

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-10 text-center">
      <h3 className="text-display text-xl font-bold uppercase text-ink">No se pudo cargar</h3>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
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
          <div className="mt-4 rounded-2xl border border-ink/10 bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-10 w-10 rounded-full bg-yellow text-ink flex items-center justify-center shrink-0">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Cuánto hacer</div>
                  <div className="text-display text-2xl font-bold leading-none text-ink mt-1">{repetitions}</div>
                </div>
              </div>
              <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shrink-0">
                Objetivo
              </span>
            </div>
          </div>
        )}
        {ex.tip && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{ex.tip}</p>}
      </div>
    </article>
  );
}
