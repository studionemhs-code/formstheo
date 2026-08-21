import { z } from "zod";

export const chainSchema = z.object({
  model: z.string().min(1, "Escolha um modelo"),
  size: z.string().max(50).optional().default(""),
  freeMedal: z.string().min(1, "Escolha a medalha de brinde"),
  marianMedals: z.array(z.string()).default([]),
  inoxMedals: z.array(z.string()).default([]),
  saintMedals: z.array(z.string()).default([]),
  pendants: z.array(z.string()).default([]),
});
export type Chain = z.infer<typeof chainSchema>;

export const medallionSchema = z.object({
  id: z.string(),
  withChain: z.enum(["com", "sem"]),
});

export const scapularSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1).max(20),
});

export const quoteSchema = z.object({
  customerName: z.string().trim().min(2, "Informe seu nome").max(120),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().trim().min(2, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(120).optional().default(""),
  neighborhood: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  state: z.string().trim().max(60).optional().default(""),
  chains: z.array(chainSchema).min(1, "Adicione ao menos uma cadeiazinha"),
  medallions: z.array(medallionSchema).default([]),
  scapulars: z.array(scapularSchema).default([]),
  notes: z.string().trim().max(1000).optional().default(""),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export function newChain(): Chain {
  return {
    model: "",
    size: "",
    freeMedal: "",
    marianMedals: [],
    inoxMedals: [],
    saintMedals: [],
    pendants: [],
  };
}
