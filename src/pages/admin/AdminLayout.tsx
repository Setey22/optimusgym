import { Link, NavLink, Outlet } from "react-router-dom";
import { Dumbbell, Users, LogOut, ArrowLeft, UserCog } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function AdminLayout() {
  const { signOut, user, isSuperadmin } = useAuth();
  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-60 bg-ink text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="text-display text-xl font-bold tracking-widest">RUTINAS</div>
          <div className="text-xs uppercase tracking-widest text-yellow mt-1">{isSuperadmin ? "Superadmin" : "Admin"}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem to="/admin" icon={Dumbbell} end>Rutinas</NavItem>
          <NavItem to="/admin/clients" icon={Users}>Clientes</NavItem>
          {isSuperadmin && <NavItem to="/admin/admins" icon={UserCog}>Administradores</NavItem>}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/80 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> Ver app
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/80 hover:bg-white/10">
            <LogOut className="h-4 w-4" /> Salir
          </button>
          {user && <div className="px-3 pt-2 text-[10px] text-white/40 truncate">{user.email}</div>}
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden"><Outlet /></main>
    </div>
  );
}

function NavItem({ to, icon: Icon, end, children }: { to: string; icon: any; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
      isActive ? "bg-yellow text-ink" : "text-white/80 hover:bg-white/10"
    )}>
      <Icon className="h-4 w-4" /> {children}
    </NavLink>
  );
}
