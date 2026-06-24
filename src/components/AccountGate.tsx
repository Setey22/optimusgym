import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AccountGate({ children }: { children: JSX.Element }) {
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  if (!user) return children;
  if (isAdmin) return children;
  const status = profile?.status ?? "pending";
  if (status === "active") return children;

  const title = status === "blocked" ? "Cuenta bloqueada" : "Cuenta pendiente";
  const msg = status === "blocked"
    ? "Tu cuenta fue bloqueada. Contactá a un administrador."
    : "Tu cuenta todavía no fue activada por un administrador.";

  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-display text-3xl font-bold uppercase tracking-widest">{title}</h1>
        <p className="text-white/70">{msg}</p>
        <Button onClick={signOut} className="bg-yellow text-ink hover:bg-yellow/90 font-bold">Cerrar sesión</Button>
      </div>
    </div>
  );
}
