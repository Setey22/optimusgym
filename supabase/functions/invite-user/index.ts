import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  email: string;
  role: "client" | "admin";
  full_name?: string;
  gender?: "hombres" | "damas" | null;
  level?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
    const isSuper = roleSet.has("superadmin");
    const isAdmin = roleSet.has("admin") || isSuper;
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = (await req.json()) as Body;
    if (!body?.email || !body?.role) return json({ error: "Missing fields" }, 400);
    if (body.role === "admin" && !isSuper) return json({ error: "Only superadmin can invite admins" }, 403);
    if (!["client", "admin"].includes(body.role)) return json({ error: "Invalid role" }, 400);

    const email = body.email.trim().toLowerCase();
    const origin = req.headers.get("origin") ?? "";
    const redirectTo = origin ? `${origin}/reset-password` : undefined;

    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    let userId = invited?.user?.id;
    if (invErr || !userId) {
      // user might already exist; look them up
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!existing) return json({ error: invErr?.message ?? "Could not invite" }, 400);
      userId = existing.id;
    }

    // Upsert profile
    await admin.from("profiles").upsert({
      user_id: userId,
      full_name: body.full_name ?? null,
      gender: body.gender ?? null,
      level: body.level ?? 1,
      status: "active",
      invited_by: callerId,
    }, { onConflict: "user_id" });

    // Assign role
    await admin.from("user_roles").insert({ user_id: userId, role: body.role }).then((r) => {
      // ignore duplicate
      return r;
    });

    return json({ ok: true, user_id: userId, invited: !invErr });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
