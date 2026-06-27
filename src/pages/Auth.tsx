import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PUBLIC_APP_URL } from "@/lib/config";
import { BrandLogo } from "@/components/BrandLogo";

type AuthMode = "signin" | "signup" | "reset";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);
  const resetSuccess = searchParams.get("reset") === "success";

  useEffect(() => {
    if (!loading && user && mode !== "reset") {
      navigate(isAdmin ? "/admin" : "/", { replace: true });
    }
  }, [user, isAdmin, loading, navigate, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    try {
      if (mode === "reset") {
        const redirectTo = `${PUBLIC_APP_URL}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

        if (error) throw error;

        setRecoveryEmail(normalizedEmail);
        toast.success("Te enviamos un email para recuperar la contraseña.");
        setMode("signin");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: `${PUBLIC_APP_URL}/admin` },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Ya podés iniciar sesión.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error";
      const isInvalidCredentials = message.toLowerCase().includes("invalid login credentials");
      toast.error(isInvalidCredentials ? "Email o contraseña inválidos. Revisá que estés usando la última clave creada." : message);
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    if (nextMode !== "signin") setRecoveryEmail(null);
  }

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <header className="px-4 md:px-8 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white text-ink rounded-2xl p-6 md:p-8 shadow-2xl">
          <h1 className="text-display text-3xl font-bold uppercase tracking-widest mb-1">
            {mode === "signin" && "Iniciar sesión"}
            {mode === "signup" && "Crear cuenta"}
            {mode === "reset" && "Recuperar contraseña"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "reset" ? "Te enviaremos un link de recuperación al email del admin." : "Acceso de administrador"}
          </p>
          {resetSuccess && mode === "signin" && (
            <div className="mb-5 rounded-xl border border-yellow/50 bg-yellow/15 p-3 text-sm text-ink">
              Contraseña actualizada. Entrá con tu email y la nueva clave.
            </div>
          )}
          {recoveryEmail && mode === "signin" && (
            <div className="mb-5 rounded-xl border border-yellow/50 bg-yellow/15 p-3 text-sm text-ink">
              Enviamos el link de recuperación a <strong>{recoveryEmail}</strong>. Revisá spam/promociones. Si no llega, hay que revisar SMTP y URLs permitidas en Supabase Auth.
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "reset" && (
              <div>
                <Label htmlFor="pw">Contraseña</Label>
                <Input id="pw" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full bg-yellow text-ink hover:bg-yellow/90 font-bold">
              {busy ? "..." : mode === "signin" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar link de recuperación"}
            </Button>
          </form>
          {mode === "signin" && (
            <button
              onClick={() => changeMode("reset")}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-ink transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {mode === "reset" && (
            <button
              onClick={() => changeMode("signin")}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-ink transition-colors"
            >
              Volver a iniciar sesión
            </button>
          )}
          <button
            onClick={() => changeMode(mode === "signup" ? "signin" : "signup")}
            className="mt-3 w-full text-sm text-muted-foreground hover:text-ink transition-colors"
          >
            {mode === "signup" ? "Ya tengo cuenta" : "¿No tenés cuenta? Crear una"}
          </button>
        </div>
      </main>
    </div>
  );
}
