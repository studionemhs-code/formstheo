import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { quoteSchema } from "./quote-schema";
import type { Database } from "@/integrations/supabase/types";

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { error } = await supabase
      .from("quote_requests" as never)
      .insert({
        customer_name: data.customerName,
        whatsapp: data.whatsapp,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement ?? null,
        neighborhood: data.neighborhood ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        chains: data.chains,
        medallions: data.medallions,
        scapulars: data.scapulars,
        notes: data.notes ?? null,
      } as never);

    if (error) {
      console.error("[submitQuoteRequest]", error);
      throw new Error("Não foi possível salvar sua solicitação. Tente novamente.");
    }
    return { ok: true };
  });
