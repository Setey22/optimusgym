import { useEffect, useState } from "react";
import { Menu, X, Play, ChevronDown, ChevronRight } from "lucide-react";
import workoutThumb from "@/assets/workout-thumb.jpg";
import { getRoutine, type Gender } from "@/data/routines";
import { cn } from "@/lib/utils";

const LEVELS = [1, 2, 3, 4, 5, 6, 7] as const;
const DAYS = [1, 2] as const;

export default function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gender, setGender] = useState<Gender>("hombres");
  const [level, setLevel] = useState<number>(1);
  const [day, setDay] = useState<1 | 2>(1);

  const exercises = getRoutine(gender, level, day);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const choose = (g: Gender, lv: number) => {
    setGender(g);
    setLevel(lv);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-ink text-white">
        <div className="flex items-center h-14 md:h-16 px-4 md:px-8">
          <button
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-white/10 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-3 text-display text-xl md:text-2xl font-bold tracking-widest">
            RUTINAS
          </h1>
          <div className="ml-auto hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-white/60">
            <span className="text-yellow font-semibold">{gender}</span>
            <span>·</span>
            <span>Nivel {level}</span>
            <span>·</span>
            <span>Día {day}</span>
          </div>
        </div>
      </header>

      {/* Side menu + overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <SideMenu
            onClose={() => setMenuOpen(false)}
            onChoose={choose}
            activeGender={gender}
            activeLevel={level}
          />
        </>
      )}

      {/* Main */}
      <main className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
        {/* Controls */}
        <section className="space-y-4 mb-8">
          <Segmented
            label="Grupo"
            options={[
              { value: "hombres", label: "HOMBRES" },
              { value: "damas", label: "DAMAS" },
            ]}
            value={gender}
            onChange={(v) => setGender(v as Gender)}
          />
          <div>
            <Label>Nivel</Label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <Pill key={lv} active={level === lv} onClick={() => setLevel(lv)}>
                  {lv}
                </Pill>
              ))}
            </div>
          </div>
          <Segmented
            label="Día"
            options={DAYS.map((d) => ({ value: String(d), label: `DÍA ${d}` }))}
            value={String(day)}
            onChange={(v) => setDay(Number(v) as 1 | 2)}
          />
        </section>

        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-display text-2xl md:text-3xl font-bold uppercase">
            Rutina del día
          </h2>
          <span className="text-sm text-muted-foreground">
            {exercises.length} ejercicios
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {exercises.map((ex) => (
            <ExerciseCard key={ex.number} number={ex.number} title={ex.title} tip={ex.tip} />
          ))}
        </div>

        <footer className="mt-12 pb-8 text-center text-xs text-muted-foreground uppercase tracking-widest">
          Entrena con foco · Sin distracciones
        </footer>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="inline-flex bg-white rounded-full p-1 border border-border shadow-sm">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                "px-5 py-2 text-sm font-bold tracking-wider rounded-full transition-all",
                active ? "bg-yellow text-ink" : "text-muted-foreground hover:text-ink"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 min-w-10 px-4 rounded-full text-sm font-bold transition-all border",
        active
          ? "bg-yellow border-yellow text-ink shadow-sm"
          : "bg-white border-border text-ink hover:border-ink"
      )}
    >
      {children}
    </button>
  );
}

function ExerciseCard({ number, title, tip }: { number: number; title: string; tip: string }) {
  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
      <div className="relative aspect-video bg-ink overflow-hidden">
        <img
          src={workoutThumb}
          alt={title}
          loading="lazy"
          width={800}
          height={512}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute top-3 left-3 bg-yellow text-ink text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
          #{String(number).padStart(2, "0")}
        </span>
        <button
          aria-label={`Reproducir ${title}`}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <span className="h-14 w-14 rounded-full bg-yellow flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-ink fill-ink ml-0.5" />
          </span>
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-display font-bold text-lg uppercase text-ink leading-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{tip}</p>
      </div>
    </article>
  );
}

function SideMenu({
  onClose, onChoose, activeGender, activeLevel,
}: {
  onClose: () => void;
  onChoose: (g: Gender, lv: number) => void;
  activeGender: Gender;
  activeLevel: number;
}) {
  const [openGroup, setOpenGroup] = useState<Gender | null>(activeGender);

  return (
    <aside
      role="dialog"
      aria-label="Menú de rutinas"
      className="fixed top-0 left-0 z-50 h-full w-[85%] max-w-sm bg-ink text-white animate-slide-in shadow-2xl flex flex-col"
    >
      <div className="flex items-center justify-between h-14 md:h-16 px-4 border-b border-white/10">
        <span className="text-display text-lg font-bold tracking-widest">MENÚ</span>
        <button
          aria-label="Cerrar menú"
          onClick={onClose}
          className="p-2 -mr-2 rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {(["hombres", "damas"] as Gender[]).map((g) => {
          const open = openGroup === g;
          return (
            <div key={g} className="mb-1">
              <button
                onClick={() => setOpenGroup(open ? null : g)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-display font-bold tracking-wider uppercase">
                  {g}
                </span>
                {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              {open && (
                <ul className="mt-1 mb-2 pl-2">
                  {LEVELS.map((lv) => {
                    const isActive = activeGender === g && activeLevel === lv;
                    return (
                      <li key={lv}>
                        <button
                          onClick={() => onChoose(g, lv)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 rounded-md text-sm font-medium tracking-wide transition-colors flex items-center justify-between",
                            isActive
                              ? "bg-yellow text-ink"
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span>Nivel {lv}</span>
                          {isActive && <span className="text-[10px] font-bold">ACTIVO</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 text-[11px] uppercase tracking-widest text-white/40">
        Rutinas · v1.0
      </div>
    </aside>
  );
}
