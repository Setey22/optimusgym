import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  user_id: string;
  full_name: string | null;
  gender: "hombres" | "damas" | null;
  level: number;
  status: "pending" | "active" | "blocked";
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isClient: boolean;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null, session: null, isAdmin: false, isSuperadmin: false, isClient: false,
  profile: null, loading: true, refreshProfile: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRolesAndProfile = useCallback(async (uid: string) => {
    const [{ data: roles }, { data: prof }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
    ]);
    const set = new Set((roles ?? []).map((r) => r.role));
    setIsSuperadmin(set.has("superadmin"));
    setIsAdmin(set.has("admin") || set.has("superadmin"));
    setIsClient(set.has("client"));
    setProfile((prof as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => { loadRolesAndProfile(s.user.id); }, 0);
      } else {
        setIsAdmin(false); setIsSuperadmin(false); setIsClient(false); setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadRolesAndProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadRolesAndProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadRolesAndProfile(user.id);
  }, [user, loadRolesAndProfile]);

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false); setIsSuperadmin(false); setIsClient(false); setProfile(null);
  }

  return (
    <Ctx.Provider value={{ user, session, isAdmin, isSuperadmin, isClient, profile, loading, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
