import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, Dumbbell, History, LogOut, Menu, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import VideoPlayerDialog from "@/components/VideoPlayerDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CompletionCelebration } from "@/components/CompletionCelebration";
import { BrandLogo } from "@/components/BrandLogo";
import AdsSection from "@/components/AdsSection";
import HistorySheet from "@/components/HistorySheet";

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

function progressKey(gender: Gender, level: number, day: number) {
  return `optimus:progress:${gender}:${level}:${day}`;
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function useDayProgress(gender: Gender, level: number, day: number, ids: string[]) {
  const key = progressKey(gender, level, day);
  const [done, setDone] = useState<Set<string>>(new Set());
  const celebratedRef = useRef<Set<string>>(new Set());

  // load when key changes; reset if stored date is not today
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { setDone(new Set()); return; }
      const parsed = JSON.parse(raw);
      // Backward compat: old format was a plain array of ids — treat as stale
      if (Array.isArray(parsed)) {
        localStorage.removeItem(key);
        setDone(new Set());
        return;
      }
      if (parsed?.date === todayStamp() && Array.isArray(parsed.ids)) {
        setDone(new Set(parsed.ids));
      } else {
        localStorage.removeItem(key);
        setDone(new Set());
      }
    } catch {
      setDone(new Set());
    }
  }, [key]);

  // Auto-reset at midnight while the app is open
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 100);
    const ms = midnight.getTime() - now.getTime();
    const t = setTimeout(() => {
      try { localStorage.removeItem(key); } catch { /* noop */ }
      setDone(new Set());
      celebratedRef.current.delete(key);
    }, ms);
    return () => clearTimeout(t);
  }, [key]);

  const total = ids.length;
  const count = useMemo(() => ids.filter((id) => done.has(id)).length, [ids, done]);
  const allDone = total > 0 && count === total;

  // celebrate once per key per session
  useEffect(() => {
    if (allDone && !celebratedRef.current.has(key)) {
      celebratedRef.current.add(key);
      toast.success("¡Día completado! 💪", {
        description: "Excelente trabajo. Disfrutá el descanso.",
      });
    }
    if (!allDone) celebratedRef.current.delete(key);
  }, [allDone, key]);

  const persist = (next: Set<string>) => {
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify({ date: todayStamp(), ids: Array.from(next) }));
    } catch { /* noop */ }
  };

  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id); else next.add(id);
    persist(next);
  };

  const reset = () => persist(new Set());

  return { done, toggle, reset, allDone, count, total };
}

export default function Index() {
  const { user, isAdmin, isClient, profile, signOut, loading: authLoading } = useAuth();
  const lockedGender = !isAdmin && isClient ? profile?.gender ?? null : null;
  const lockedLevel = !isAdmin && isClient ? profile?.level ?? null : null;
  const [gender, setGender] = useState<Gender>(lockedGender ?? "hombres");
  const [level, setLevel] = useState(lockedLevel ?? 1);
  const [day, setDay] = useState(1);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<Exercise | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (lockedGender && gender !== lockedGender) setGender(lockedGender);
    if (lockedLevel && level !== lockedLevel) setLevel(lockedLevel);
  }, [lockedGender, lockedLevel, gender, level]);

  // Public landing for visitors
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-ink text-white flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 text-center">
          <div className="max-w-lg space-y-5">
            <h1 className="text-display text-4xl md:text-6xl font-black uppercase tracking-widest">Optimus Gym</h1>
            <p className="text-white/70">Plataforma privada de entrenamiento. Accedé con tu cuenta para ver tus rutinas.</p>
            <Link to="/auth" className="inline-block bg-yellow text-ink font-bold px-6 py-3 rounded-full uppercase tracking-widest text-sm">
              Iniciar sesión
            </Link>
          </div>
        </main>
        <footer className="pb-6 text-center text-[10px] text-white/40 uppercase tracking-widest">
          Acceso solo por invitación
        </footer>
      </div>
    );
  }

  // Client without assigned gender: show waiting screen
  if (!authLoading && user && !isAdmin && isClient && !lockedGender) {
    return (
      <div className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-display text-3xl font-bold uppercase tracking-widest">Sin grupo asignado</h1>
          <p className="text-white/70">Pedile a tu administrador que te asigne un grupo (Hombres o Damas) para ver tus rutinas.</p>
          <button onClick={signOut} className="text-yellow font-bold uppercase tracking-widest text-sm">Cerrar sesión</button>
        </div>
      </div>
    );
  }

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

  const ids = useMemo(() => dayExercises.map((e) => e.id), [dayExercises]);
  const { done, toggle, reset, allDone, count, total } = useDayProgress(gender, level, day, ids);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  // Log completion to the cloud once per day/rutine/user
  const loggedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!allDone || !user || !routine || total === 0) return;
    const key = `${user.id}:${routine.id}:${day}:${new Date().toDateString()}`;
    if (loggedRef.current.has(key)) return;
    loggedRef.current.add(key);
    supabase.from("completed_days").insert({
      user_id: user.id,
      routine_id: routine.id,
      routine_name: routine.name,
      gender,
      level,
      day,
    }).then(({ error }) => {
      if (error && error.code !== "23505") {
        console.error("completed_days insert", error);
        loggedRef.current.delete(key);
      }
    });
  }, [allDone, user, routine, day, gender, level, total]);

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
            <SheetContent side="left" className="w-[88vw] max-w-sm bg-surface p-0 flex flex-col gap-0 border-r-0">
              {/* Dark header */}
              <SheetHeader className="bg-ink text-white p-5 space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <BrandLogo size={36} />
                  <div className="min-w-0">
                    <SheetTitle className="text-display text-xl font-black uppercase tracking-widest text-white leading-none">
                      Menú
                    </SheetTitle>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">
                      Optimus Gym
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <div className="h-8 w-8 rounded-full bg-yellow text-ink flex items-center justify-center text-display font-black text-sm shrink-0">
                    {level}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 leading-none">
                      {gender === "hombres" ? "Hombres" : "Damas"}
                    </p>
                    <p className="text-sm font-bold text-white leading-tight mt-0.5">
                      Nivel {level} · Día {day}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Day selector */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Elegí el día
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">
                      {dayTabs.length} días
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {dayTabs.map((d) => {
                      const active = day === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setDay(d)}
                          className={cn(
                            "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all",
                            active
                              ? "bg-yellow border-yellow text-ink shadow-sm"
                              : "bg-white border-border text-ink hover:border-ink"
                          )}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">
                            Día
                          </span>
                          <span className="text-display text-2xl font-black leading-none mt-1">
                            {d}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Actions */}
                <section className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Acciones
                  </p>
                  <MenuAction
                    icon={Dumbbell}
                    label="Ver ejercicios"
                    hint="Volvé a la rutina de hoy"
                    highlight
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuAction
                    icon={History}
                    label="Mi historial"
                    hint="Progreso y calendario"
                    onClick={() => { setMenuOpen(false); setHistoryOpen(true); }}
                  />
                  {user && (
                    <MenuAction
                      icon={LogOut}
                      label="Cerrar sesión"
                      hint={profile?.full_name ?? user.email ?? ""}
                      onClick={() => { setMenuOpen(false); signOut(); }}
                    />
                  )}
                </section>
              </div>

              <div className="p-4 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-t border-border">
                Entrená con foco
              </div>
            </SheetContent>
          </Sheet>
          <BrandLogo size={32} />
          <h1 className="text-display text-xl md:text-2xl font-bold tracking-widest">RUTINAS</h1>
          <div className="ml-auto text-[11px] font-semibold uppercase tracking-widest text-white/60 truncate">
            {summary}
          </div>
        </div>
      </header>

      {routine && !loading && !loadError && total > 0 && (
        <div className="sticky top-14 md:top-16 z-20 bg-ink text-white">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-4 pb-3">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase">Entrenamiento hoy</p>
                <h2 className="text-display text-xl md:text-2xl font-black uppercase tracking-tight leading-none mt-1">
                  {formatTodayEs()}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <p className="text-display text-2xl md:text-3xl font-black text-yellow leading-none">{pct}%</p>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    {count} / {total} ejercicios
                  </p>
                  <button
                    onClick={reset}
                    className="text-[10px] font-bold text-white/50 hover:text-yellow transition-colors uppercase tracking-widest inline-flex items-center gap-1"
                    aria-label="Reiniciar progreso del día"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto w-full flex-1">
        {allDone && routine && !loading && !loadError && total > 0 && (
          <div className="px-4 md:px-8 pt-6">
            <CompletionCelebration />
          </div>
        )}
        {loading ? (
          <div className="text-muted-foreground px-4 md:px-8 py-6">Cargando…</div>
        ) : loadError ? (
          <div className="px-4 md:px-8 py-6"><ErrorState message={loadError} /></div>
        ) : !routine ? (
          <div className="px-4 md:px-8 py-6"><EmptyState /></div>
        ) : dayExercises.length === 0 ? (
          <div className="px-4 md:px-8 py-6">
            <div className="bg-white rounded-2xl border border-border p-10 text-center text-muted-foreground">
              Aún no hay ejercicios cargados para este día.
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:mt-2">
            {dayExercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                index={i + 1}
                ex={ex}
                done={done.has(ex.id)}
                onToggle={() => toggle(ex.id)}
                onPlay={() => setPlaying(ex)}
              />
            ))}
          </div>
        )}
        {routine && !loading && !loadError && <AdsSection gender={gender} />}
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
      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
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

function MenuAction({
  icon: Icon, label, hint, onClick, highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; hint?: string; onClick: () => void; highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 rounded-xl border p-3 transition-all text-left overflow-hidden relative",
        highlight
          ? "bg-ink border-ink text-white hover:bg-ink/90"
          : "bg-white border-border text-ink hover:border-ink"
      )}
    >
      <span
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
          highlight ? "bg-yellow text-ink" : "bg-yellow/20 text-ink"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-display text-sm font-black uppercase tracking-widest leading-none">
          {label}
        </span>
        {hint && (
          <span
            className={cn(
              "block text-[10px] font-semibold uppercase tracking-widest mt-1 truncate",
              highlight ? "text-white/60" : "text-muted-foreground"
            )}
          >
            {hint}
          </span>
        )}
      </span>
      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
          highlight ? "text-white/70" : "text-ink/40"
        )}
      />
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("h-10 min-w-10 px-4 rounded-full text-sm font-bold transition-all border", active ? "bg-yellow border-yellow text-ink shadow-sm" : "bg-white border-border text-ink hover:border-ink")}>{children}</button>
  );
}

function formatTodayEs() {
  try {
    const s = new Date().toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" });
    return s.replace(/\./g, "").toUpperCase();
  } catch {
    return "";
  }
}

function ExerciseRow({
  index, ex, done, onToggle, onPlay,
}: { index: number; ex: Exercise; done: boolean; onToggle: () => void; onPlay: () => void }) {
  const hasVideo = ex.video_type !== "none";
  const repetitions = ex.repetitions?.trim();

  return (
    <div className={cn(
      "flex border-b border-border relative overflow-hidden transition-colors",
      done ? "bg-secondary" : "bg-white"
    )}>
      <div className={cn("w-1.5 shrink-0", done ? "bg-muted-foreground/30" : "bg-yellow")} />
      <div className={cn("flex-1 min-w-0 px-4 py-5 md:px-6", done && "opacity-60")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
            #{String(index).padStart(2, "0")}
          </span>
          {hasVideo && (
            <button
              onClick={onPlay}
              aria-label={`Reproducir ${ex.title}`}
              className="inline-flex items-center gap-1 text-ink/50 hover:text-ink transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Video</span>
            </button>
          )}
        </div>
        <h3 className={cn(
          "text-display text-xl md:text-2xl font-black uppercase leading-tight tracking-tight text-ink",
          done && "line-through decoration-2"
        )}>
          {ex.title}
        </h3>
        {repetitions && (
          <div className="mt-2">
            <span className={cn(
              "inline-block rounded-md px-2.5 py-1 text-display text-sm font-black leading-none",
              done ? "bg-muted text-muted-foreground" : "bg-yellow text-ink"
            )}>
              {repetitions}
            </span>
          </div>
        )}
      </div>

      {done && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-ink/15 text-ink/15 px-4 py-1 -rotate-12 font-black text-2xl uppercase tracking-tighter text-display">
            Completado
          </div>
        </div>
      )}

      <button
        onClick={onToggle}
        aria-label={done ? "Marcar como pendiente" : "Marcar como hecho"}
        aria-pressed={done}
        className={cn(
          "w-24 shrink-0 border-l border-border flex flex-col items-center justify-center gap-1 transition-colors relative z-10",
          done
            ? "bg-secondary text-muted-foreground hover:bg-muted"
            : "bg-white text-ink hover:bg-yellow/20 active:bg-yellow"
        )}
      >
        <Check className={cn("h-9 w-9 transition-transform", !done && "stroke-[3]")} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {done ? "Listo" : "Hecho"}
        </span>
      </button>
    </div>
  );
}

