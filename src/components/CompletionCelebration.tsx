import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CompletionCelebration() {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const defaults = {
      disableForReducedMotion: true,
      origin: { y: 0.7 },
      zIndex: 100,
    };

    const burst = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    burst(0.25, { spread: 26, startVelocity: 55, colors: ["#FACC15", "#F59E0B", "#EF4444"] });
    burst(0.2, { spread: 60, colors: ["#22C55E", "#3B82F6", "#A855F7"] });
    burst(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#FACC15", "#06B6D4", "#F97316"] });
    burst(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#EAB308", "#EC4899", "#8B5CF6"] });
    burst(0.1, { spread: 120, startVelocity: 45, colors: ["#14B8A6", "#F43F5E", "#6366F1"] });

    const end = Date.now() + 800;
    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);
      confetti({
        ...defaults,
        particleCount: 12,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FACC15", "#22C55E", "#3B82F6"],
      });
      confetti({
        ...defaults,
        particleCount: 12,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FACC15", "#22C55E", "#3B82F6"],
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "relative mb-5 overflow-hidden rounded-3xl border-2 border-yellow/40 bg-ink text-white shadow-2xl",
        "animate-celebration-pop"
      )}
      role="status"
      aria-live="polite"
    >
      {/* subtle spotlight */}
      <div className="pointer-events-none absolute -left-1/2 -top-1/2 h-[200%] w-[200%] animate-spotlight-rotate bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.18),transparent_45%)]" />

      <div className="relative z-10 px-6 py-6 text-center md:px-8 md:py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-trophy-bounce items-center justify-center rounded-full bg-yellow shadow-[0_0_40px_rgba(250,204,21,0.45)] md:h-20 md:w-20">
          <Trophy className="h-8 w-8 text-ink md:h-10 md:w-10" strokeWidth={2.5} />
        </div>

        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-yellow/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-yellow">
          <Zap className="h-3 w-3 fill-yellow" /> Logro desbloqueado
        </div>

        <h2 className="text-display mt-2 text-3xl font-black uppercase tracking-wider text-white md:text-4xl">
          ¡Día completado!
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-white/80 md:text-base">
          Convertiste el esfuerzo en progreso. Descansá, recuperate y volvé mañana con más energía.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
            100% completado
          </span>
          <span className="rounded-full bg-yellow px-4 py-2 text-xs font-black uppercase tracking-widest text-ink">
            Todo hecho
          </span>
        </div>
      </div>
    </div>
  );
}
