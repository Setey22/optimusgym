import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { publicUrl } from "@/lib/media";

type Routine = {
  id: string; gender: "hombres" | "damas"; level: number; name: string;
  days_count: number; is_published: boolean; cover_image_url: string | null;
};

export default function RoutinesList() {
  const [rows, setRows] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("routines")
      .select("id,gender,level,name,days_count,is_published,cover_image_url")
      .order("gender").order("level");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Routine[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function createNew() {
    const { data, error } = await supabase.from("routines").insert({
      gender: "hombres", level: 1, name: "Nueva rutina", days_count: 1, is_published: false,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    navigate(`/admin/routines/${data.id}`);
  }

  async function togglePublish(r: Routine) {
    const { error } = await supabase.from("routines").update({ is_published: !r.is_published }).eq("id", r.id);
    if (error) toast.error(error.message); else load();
  }

  async function remove(r: Routine) {
    if (!confirm(`¿Eliminar "${r.name}"?`)) return;
    const { error } = await supabase.from("routines").delete().eq("id", r.id);
    if (error) toast.error(error.message); else load();
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-display text-3xl font-bold uppercase tracking-widest">Rutinas</h1>
        <Button onClick={createNew} className="bg-yellow text-ink hover:bg-yellow/90 font-bold">
          <Plus className="h-4 w-4" /> Nueva rutina
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground border border-border">
          Todavía no hay rutinas. Creá la primera.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => {
            const img = publicUrl("routine-covers", r.cover_image_url);
            return (
              <article key={r.id} className="bg-white rounded-2xl overflow-hidden border border-border">
                <div className="relative aspect-video bg-surface">
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs uppercase tracking-widest">Sin portada</div>}
                  <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${r.is_published ? "bg-yellow text-ink" : "bg-ink/80 text-white"}`}>
                    {r.is_published ? "Publicada" : "Borrador"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.gender} · Nivel {r.level} · {r.days_count} día{r.days_count > 1 ? "s" : ""}</div>
                  <h3 className="text-display font-bold text-lg uppercase mt-1 leading-tight">{r.name}</h3>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/admin/routines/${r.id}`} className="flex-1">
                      <Button variant="outline" className="w-full"><Pencil className="h-4 w-4" /> Editar</Button>
                    </Link>
                    <Button variant="outline" size="icon" onClick={() => togglePublish(r)} title={r.is_published ? "Despublicar" : "Publicar"}>
                      {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => remove(r)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
