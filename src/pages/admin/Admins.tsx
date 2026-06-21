import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Row = { id: string; user_id: string; email?: string };

export default function Admins() {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("user_roles").select("id,user_id").eq("role", "admin");
    if (error) { toast.error(error.message); setLoading(false); return; }
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function revoke(r: Row) {
    if (r.user_id === user?.id) { toast.error("No podés revocarte a vos mismo."); return; }
    if (!confirm("¿Revocar admin?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", r.id);
    if (error) toast.error(error.message); else load();
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <h1 className="text-display text-3xl font-bold uppercase tracking-widest mb-6">Administradores</h1>

      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <div className="text-sm text-muted-foreground mb-3">
          Por seguridad, para sumar un nuevo admin la persona primero debe <strong>crear su cuenta</strong> desde la página de Iniciar sesión. Después, copiá su <strong>user ID</strong> y pegalo abajo.
        </div>
        <Label>User ID</Label>
        <div className="flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="uuid del usuario" />
          <Button
            onClick={async () => {
              if (!email.trim()) return;
              const { error } = await supabase.from("user_roles").insert({ user_id: email.trim(), role: "admin" });
              if (error) toast.error(error.message); else { setEmail(""); toast.success("Admin agregado"); load(); }
            }}
            className="bg-ink text-white hover:bg-ink/90"
          >Agregar</Button>
        </div>
      </div>

      {loading ? <div className="text-muted-foreground">Cargando…</div> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">User ID</div>
                <div className="font-mono text-sm">{r.user_id}{r.user_id === user?.id && <span className="ml-2 text-xs text-yellow-foreground bg-yellow px-2 py-0.5 rounded">vos</span>}</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => revoke(r)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
