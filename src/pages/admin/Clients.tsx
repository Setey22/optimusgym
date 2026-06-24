import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Lock, Unlock, Trash2 } from "lucide-react";

type ClientRow = {
  user_id: string;
  full_name: string | null;
  gender: "hombres" | "damas" | null;
  level: number;
  status: "pending" | "active" | "blocked";
  email?: string;
};

export default function Clients() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"hombres" | "damas">("hombres");
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data: clientRoles, error: e1 } = await supabase
      .from("user_roles").select("user_id").eq("role", "client");
    if (e1) { toast.error(e1.message); setLoading(false); return; }
    const ids = (clientRoles ?? []).map((r) => r.user_id);
    if (ids.length === 0) { setRows([]); setLoading(false); return; }
    const { data: profs, error: e2 } = await supabase
      .from("profiles").select("*").in("user_id", ids);
    if (e2) { toast.error(e2.message); setLoading(false); return; }
    setRows((profs ?? []) as ClientRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim().toLowerCase(), role: "client", full_name: fullName || null, gender, level },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Cliente invitado. Se le envió un email.");
      setEmail(""); setFullName("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al invitar");
    } finally {
      setBusy(false);
    }
  }

  async function updateField(user_id: string, patch: { gender?: "hombres" | "damas" | null; level?: number; status?: "pending" | "active" | "blocked" }) {
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user_id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  async function removeClient(r: ClientRow) {
    if (!confirm("¿Quitar acceso de cliente a este usuario?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", r.user_id).eq("role", "client");
    if (error) toast.error(error.message); else load();
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-display text-3xl font-bold uppercase tracking-widest mb-6">Clientes</h1>

      <form onSubmit={invite} className="bg-white rounded-2xl border border-border p-5 mb-6 grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <Label>Email</Label>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" />
        </div>
        <div className="md:col-span-2">
          <Label>Nombre</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" />
        </div>
        <div>
          <Label>Sexo</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={gender} onChange={(e) => setGender(e.target.value as "hombres" | "damas")}>
            <option value="hombres">Hombres</option>
            <option value="damas">Damas</option>
          </select>
        </div>
        <div>
          <Label>Nivel</Label>
          <Input type="number" min={1} max={7} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
        </div>
        <div className="md:col-span-4 flex items-end">
          <Button type="submit" disabled={busy} className="bg-ink text-white hover:bg-ink/90">
            <UserPlus className="h-4 w-4 mr-2" /> {busy ? "Invitando…" : "Invitar cliente"}
          </Button>
        </div>
      </form>

      {loading ? <div className="text-muted-foreground">Cargando…</div> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.user_id} className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="font-bold">{r.full_name || "(sin nombre)"}</div>
                <div className="text-xs font-mono text-muted-foreground">{r.user_id}</div>
              </div>
              <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={r.gender ?? ""} onChange={(e) => updateField(r.user_id, { gender: (e.target.value || null) as "hombres" | "damas" | null })}>
                <option value="">— Sexo —</option>
                <option value="hombres">Hombres</option>
                <option value="damas">Damas</option>
              </select>
              <input type="number" min={1} max={7} value={r.level} onChange={(e) => updateField(r.user_id, { level: Number(e.target.value) })} className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm" />
              <span className={`text-xs uppercase px-2 py-1 rounded ${r.status === "active" ? "bg-emerald-100 text-emerald-800" : r.status === "blocked" ? "bg-red-100 text-red-800" : "bg-yellow text-ink"}`}>{r.status}</span>
              {r.status === "blocked" ? (
                <Button size="sm" variant="outline" onClick={() => updateField(r.user_id, { status: "active" })}><Unlock className="h-4 w-4 mr-1" /> Activar</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => updateField(r.user_id, { status: "blocked" })}><Lock className="h-4 w-4 mr-1" /> Bloquear</Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => removeClient(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </li>
          ))}
          {rows.length === 0 && <div className="text-muted-foreground">Todavía no hay clientes.</div>}
        </ul>
      )}
    </div>
  );
}
