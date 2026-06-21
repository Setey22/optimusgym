import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ResetStatus = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ResetStatus>("checking");
  const [statusMessage, setStatusMessage] = useState("Validando link de recuperación...");

  useEffect(() => {
    let mounted = true;

    async function prepareRecoverySession() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const errorDescription = hash.get("error_description") || url.searchParams.get("error_description");

      if (errorDescription) {
        if (!mounted) return;
        setStatus("invalid");
        setStatusMessage(decodeURIComponent(errorDescription));
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = url.searchParams.get("code");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!mounted) return;
        if (error) {
          setStatus("invalid");
          setStatusMessage(error.message);
          return;
        }

        window.history.replaceState({}, document.title, url.pathname);
        setStatus("ready");
        setStatusMessage("Link validado. Ya podés crear una contraseña nueva.");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!mounted) return;
        if (error) {
          setStatus("invalid");
          setStatusMessage(error.message);
          return;
        }

        window.history.replaceState({}, document.title, url.pathname);
        setStatus("ready");
        setStatusMessage("Link validado. Ya podés crear una contraseña nueva.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        setStatus("ready");
        setStatusMessage("Sesión validada. Ya podés crear una contraseña nueva.");
      } else {
        setStatus("invalid");
        setStatusMessage("Abrí esta pantalla desde el link de recuperación del email. Si el link venció, pedí uno nuevo.");
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
        setStatusMessage("Link validado. Ya podés crear una contraseña nueva.");
      }
    });

    prepareRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (status !== "ready") {
      toast.error("Necesitás abrir esta pantalla desde un link de recuperación válido.");
      return;
    }

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

      await supabase.auth.signOut();
      toast.success("Contraseña actualizada. Iniciá sesión con tu nueva clave.");
      navigate("/auth?reset=success", { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la contraseña.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white text-ink border border-border shadow-2xl p-6 md:p-8">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al login
        </Link>
        <h1 className="text-display text-3xl font-bold uppercase tracking-widest mb-2">Crear nueva contraseña</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Escribí tu nueva contraseña para recuperar el acceso al panel admin.
        </p>
        <div className={status === "invalid" ? "mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" : "mb-6 rounded-xl border border-border bg-surface p-3 text-sm text-muted-foreground"}>
          {statusMessage}
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={status !== "ready" || busy}
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
              disabled={status !== "ready" || busy}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button className="w-full bg-yellow text-ink hover:bg-yellow/90 font-bold" type="submit" disabled={status !== "ready" || busy}>
            {busy ? "Guardando..." : "Guardar nueva contraseña"}
          </Button>
        </form>
        {status === "invalid" && (
          <Link to="/auth" className="mt-4 block text-center text-sm text-muted-foreground hover:text-ink">
            Pedir otro link de recuperación
          </Link>
        )}
      </div>
    </div>
  );
}
