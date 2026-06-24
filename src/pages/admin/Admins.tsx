import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Row = { user_id: string; role: "admin" | "superadmin" };

export default function Admins() {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isSuperadmin } = useAuth();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("user_roles").select("user_id,role").in("role", ["admin", "superadmin"]);
    if (error) { toast.error(error.message); setLoading(false); return; }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim().toLowerCase(), role: "admin" },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Admin invitado. Se le envió un email.");
      setEmail("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al invitar");
    } finally { setBusy(false); }
  }

  async function revoke(r: Row) {
    if (r.user_id === user?.id) { toast.error("No podés revocarte a vos mismo."); return; }
    if (!confirm(`¿Revocar ${r.role}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", r.user_id).eq("role", r.role);
    if (error) toast.error(error.message); else load();
  }

  if (!isSuperadmin) {
    return <div className="p-6 md:p-8 max-w-3xl"><h1 className="text-display text-3xl font-bold uppercase tracking-widest mb-4">Administradores</h1><p className="text-muted-foreground">Solo el superadmin puede gestionar admins.</p></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-display text-3xl font-bold uppercase tracking-widest mb-6">Administradores</h1>

      <form onSubmit={invite} className="bg-white rounded-2xl border border-border p-5 mb-6">
        <Label>Invitar admin por email</Label>
        <div className="flex gap-2 mt-1">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" />
          <Button type="submit" disabled={busy} className="bg-ink text-white hover:bg-ink/90">
            <UserPlus className="h-4 w-4 mr-2" /> {busy ? "..." : "Invitar"}
          </Button>
        </div>
      </form>

      {loading ? <div className="text-muted-foreground">Cargando…</div> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={`${r.user_id}-${r.role}`} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.role}</div>
                <div className="font-mono text-sm">{r.user_id}{r.user_id === user?.id && <span className="ml-2 text-xs text-ink bg-yellow px-2 py-0.5 rounded">vos</span>}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => revoke(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
