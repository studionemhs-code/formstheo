import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

/* ---------- Public: called from the homepage ---------- */

// Validates the token, increments visits when valid+active, returns status.
export const checkShareToken = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("share_link")
      .select("token, active")
      .eq("id", 1)
      .single();
    if (error || !row) return { valid: false, active: false } as const;
    const matches = row.token === data.token;
    if (!matches) return { valid: false, active: false } as const;
    if (!row.active) return { valid: true, active: false } as const;

    await supabaseAdmin
      .from("share_link")
      .update({ visits: ((row as { visits?: number }).visits ?? 0) + 1 })
      .eq("id", 1);
    return { valid: true, active: true } as const;
  });

// Increments the share counter after client-side share/copy.
export const recordShareClick = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("share_link")
      .select("token, active, shares")
      .eq("id", 1)
      .single();
    if (!row || row.token !== data.token || !row.active) return { ok: false };
    await supabaseAdmin
      .from("share_link")
      .update({ shares: (row.shares ?? 0) + 1 })
      .eq("id", 1);
    return { ok: true };
  });

/* ---------- Admin: called from the panel ---------- */

export const getShareLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("share_link")
      .select("token, active, message, visits, shares, updated_at")
      .eq("id", 1)
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateShareLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        active: z.boolean().optional(),
        message: z.string().min(1).max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: { active?: boolean; message?: string } = {};
    if (typeof data.active === "boolean") patch.active = data.active;
    if (typeof data.message === "string") patch.message = data.message;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase.from("share_link").update(patch).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const regenerateShareToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    // Generate a URL-safe token (18 hex chars)
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const { error } = await context.supabase
      .from("share_link")
      .update({ token, visits: 0, shares: 0 })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true, token };
  });

export const resetShareStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("share_link")
      .update({ visits: 0, shares: 0 })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
