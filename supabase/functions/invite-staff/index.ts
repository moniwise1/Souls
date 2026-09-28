// Souls by Zamani — team invitations (Supabase Edge Function)
// Invites a team member by email with a role and job title, resends an
// invitation, or removes a member. Only staff whose role includes
// "Manage staff & roles" can call it; only the owner can create owners.
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy a new function →
// name it "invite-staff" → paste this file → Deploy. (Or with the CLI:
// `supabase functions deploy invite-staff`.) No secrets to add: Supabase
// provides SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    // The caller, acting with their own permissions
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: me } = await caller.auth.getUser();
    if (!me.user) return reply({ error: "Please sign in again." }, 401);
    const { data: allowed } = await caller.rpc("has_perm", { perm: "staff.manage" });
    if (!allowed) return reply({ error: "Your role can't manage the team." }, 403);
    const { data: myRole } = await caller.rpc("my_role");

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const log = (action: string, id: string, details: unknown) =>
      admin.from("audit_log").insert({ actor: me.user!.id, actor_email: me.user!.email, action, entity: "staff", entity_id: id, details });

    if (body.action === "invite") {
      const email = String(body.email || "").trim().toLowerCase();
      const role = String(body.role || "");
      if (!/^\S+@\S+\.\S+$/.test(email)) return reply({ error: "Enter a valid email." }, 400);
      const { data: r } = await admin.from("roles").select("key").eq("key", role).maybeSingle();
      if (!r) return reply({ error: "Choose a valid role." }, 400);
      if (role === "owner" && myRole !== "owner") return reply({ error: "Only the owner can add another owner." }, 403);

      // Sign-ups are invite-only (see schema.sql); allow this email through.
      await admin.from("pending_invites").upsert({ email });
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name: body.name || "" }, redirectTo: body.redirectTo || undefined,
      });
      if (error) {
        const msg = /already been registered|already exists/i.test(error.message)
          ? "That email already has an account. Remove the old member first, or use a different email." : error.message;
        return reply({ error: msg }, 400);
      }
      const { error: e2 } = await admin.from("staff").upsert({
        user_id: data.user.id, email, name: body.name || "", title: body.title || "", role,
        active: true, invited_at: new Date().toISOString(), invited_by: me.user.id,
      });
      if (e2) return reply({ error: e2.message }, 400);
      await admin.from("pending_invites").delete().eq("email", email);
      await log("invited team member", email, { role, title: body.title || "" });
      return reply({ ok: true });
    }

    if (body.action === "resend") {
      const { error } = await admin.auth.admin.inviteUserByEmail(String(body.email), { redirectTo: body.redirectTo || undefined });
      if (error) return reply({ error: error.message }, 400);
      return reply({ ok: true });
    }

    if (body.action === "remove") {
      const id = String(body.user_id || "");
      if (id === me.user.id) return reply({ error: "You can't remove yourself." }, 400);
      const { data: s } = await admin.from("staff").select("role,email").eq("user_id", id).maybeSingle();
      if (s?.role === "owner") return reply({ error: "The owner can't be removed." }, 403);
      await admin.from("staff").delete().eq("user_id", id);
      await admin.auth.admin.deleteUser(id);
      await log("removed team member", s?.email ?? id, {});
      return reply({ ok: true });
    }
    return reply({ error: "Unknown action" }, 400);
  } catch (e) {
    return reply({ error: String((e as Error).message || e) }, 500);
  }
});
