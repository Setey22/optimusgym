import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedAdminRoute({
  children, requireSuperadmin = false,
}: { children: JSX.Element; requireSuperadmin?: boolean }) {
  const { user, isAdmin, isSuperadmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requireSuperadmin && !isSuperadmin) return <Navigate to="/admin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
