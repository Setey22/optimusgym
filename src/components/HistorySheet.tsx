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
