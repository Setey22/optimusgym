import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarCheck, ChevronLeft, ChevronRight, Flame, TrendingUp } from "lucide-react";

type Row = {
  id: string;
  routine_name: string | null;
  gender: "hombres" | "damas";
  level: number;
  day: number;
  completed_at: string;
};

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function calcStreak(rows: Row[]) {
  if (rows.length === 0) return 0;
  const days = new Set(
    rows.map((r) => {
      const d = new Date(r.completed_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // if today is not present, start counting from yesterday
  const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HistorySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("completed_days")
        .select("id, routine_name, gender, level, day, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(200);
      if (cancel) return;
      if (error) console.error("history load", error);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [open, user]);

  const total = rows.length;
  const streak = useMemo(() => calcStreak(rows), [rows]);
  const thisMonth = useMemo(() => {
    const now = new Date();
    return rows.filter((r) => {
      const d = new Date(r.completed_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [rows]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[92vw] max-w-md bg-surface p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border bg-ink text-white">
          <SheetTitle className="text-display tracking-widest text-white">MI HISTORIAL</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 p-4 bg-ink text-white">
          <Stat icon={CalendarCheck} label="Totales" value={total} />
          <Stat icon={Flame} label="Racha" value={streak} />
          <Stat icon={TrendingUp} label="Este mes" value={thisMonth} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <MonthCalendar rows={rows} />

          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-display text-lg font-bold uppercase tracking-widest text-ink">Sin registros</p>
              <p className="text-sm text-muted-foreground mt-2">Todavía no completaste ningún día. ¡Vamos!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-yellow/20 text-ink flex items-center justify-center shrink-0">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {fmtDate(r.completed_at)}
                    </p>
                    <p className="text-sm font-bold text-ink truncate">
                      {r.routine_name ?? "Rutina"}
                    </p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      {r.gender === "hombres" ? "Hombres" : "Damas"} · Nivel {r.level} · Día {r.day}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
      <Icon className="h-4 w-4 text-yellow mx-auto mb-1" />
      <p className="text-display text-2xl font-black text-yellow leading-none">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mt-1">{label}</p>
    </div>
  );
}

const WD = ["L", "M", "M", "J", "V", "S", "D"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  // Monday-first offset: getDay() Sun=0..Sat=6 → Mon=0..Sun=6
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }
  return cells;
}

function MonthCalendar({ rows }: { rows: Row[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [visible, setVisible] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const completedSet = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(dayKey(new Date(r.completed_at))));
    return s;
  }, [rows]);

  const cells = useMemo(
    () => buildMonthGrid(visible.getFullYear(), visible.getMonth()),
    [visible],
  );

  const todayKey = dayKey(today);
  const monthLabel = visible.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const canGoNext =
    visible.getFullYear() < today.getFullYear() ||
    (visible.getFullYear() === today.getFullYear() && visible.getMonth() < today.getMonth());

  const activeThisMonth = cells.filter(
    (c) => c.inMonth && completedSet.has(dayKey(c.date)),
  ).length;

  return (
    <div className="bg-white rounded-xl border border-border p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setVisible(new Date(visible.getFullYear(), visible.getMonth() - 1, 1))}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-ink hover:bg-surface"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-display text-sm font-black uppercase tracking-widest text-ink">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => canGoNext && setVisible(new Date(visible.getFullYear(), visible.getMonth() + 1, 1))}
          disabled={!canGoNext}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-ink hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WD.map((d, i) => (
          <div key={i} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }, i) => {
          const k = dayKey(date);
          const done = completedSet.has(k);
          const isToday = k === todayKey;
          return (
            <div
              key={i}
              className={[
                "relative aspect-square rounded-md flex items-center justify-center text-xs font-bold",
                inMonth ? "text-ink" : "text-muted-foreground/40",
                done ? "bg-yellow/30" : "bg-surface",
                isToday ? "ring-2 ring-ink" : "",
              ].join(" ")}
            >
              <span className="text-display">{date.getDate()}</span>
              {done && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none">⭐</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center mt-3">
        {activeThisMonth} {activeThisMonth === 1 ? "día" : "días"} con actividad
      </p>
    </div>
  );
}

