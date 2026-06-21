import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    try {
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Contraseña actualizada. Ya podés entrar al panel.");
      navigate("/admin", { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la contraseña.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-border shadow-lg p-8">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al login
        </Link>
        <h1 className="font-display text-3xl font-black mb-2">Crear nueva contraseña</h1>
        <p className="text-muted-foreground mb-8">
          Escribí tu nueva contraseña para recuperar el acceso al panel admin.
        </p>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Repetir contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button className="w-full h-12 text-base" type="submit" disabled={busy}>
            {busy ? "Guardando..." : "Guardar nueva contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
