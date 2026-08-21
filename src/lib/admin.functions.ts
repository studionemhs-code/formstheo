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

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, userId: context.userId };
  });

/* ---------- Orders ---------- */

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.string().min(1).max(30) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("quote_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("quote_requests")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Products ---------- */

const productInput = z.object({
  id: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  category: z.enum(["chain", "marian", "inox", "saint", "pendant", "medallion", "scapular"]),
  label: z.string().min(1).max(120),
  image: z.string().min(1, "Imagem obrigatória"),
  sort_order: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
  in_stock: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).max(999999).nullable().default(null),
});

export const listAllProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("category")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("products")
      .upsert(data, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Settings ---------- */

const settingsInput = z.object({
  whatsapp: z.string().regex(/^\d{10,15}$/, "Somente dígitos (DDI + DDD + número)"),
  brand_name: z.string().min(1).max(80),
  hero_title: z.string().min(1).max(160),
  hero_subtitle: z.string().min(1).max(280),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor hex inválida"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor hex inválida"),
  logo_url: z.string().url().nullable().or(z.literal("").transform(() => null)),
  message_template: z.string().min(1).max(4000),
  step_labels: z.array(z.string().min(1).max(40)).length(5),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .update(data)
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
