import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Dumbbell, Users, LogOut, ArrowLeft, UserCog, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminLayout() {
  const { signOut, user, isSuperadmin } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const SidebarContent = (
    <div className="h-full bg-ink text-white flex flex-col">
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <BrandLogo size={44} />
        <div>
          <div className="text-display text-xl font-bold tracking-widest">RUTINAS</div>
          <div className="text-xs uppercase tracking-widest text-yellow mt-1">{isSuperadmin ? "Superadmin" : "Admin"}</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1" onClick={() => setOpen(false)}>
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
    </div>
  );

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden md:flex w-60 shrink-0">{SidebarContent}</aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-30 bg-ink text-white flex items-center gap-2 px-3 h-14 border-b border-white/10">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-ink border-none">
              {SidebarContent}
            </SheetContent>
          </Sheet>
          <BrandLogo size={28} />
          <div className="text-display text-base font-bold tracking-widest">ADMIN</div>
        </header>
        <main key={location.pathname} className="flex-1 min-w-0 overflow-x-hidden"><Outlet /></main>
      </div>
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
