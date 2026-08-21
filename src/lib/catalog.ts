import { supabase } from "@/integrations/supabase/client";

export type ProductCategory =
  | "chain"
  | "marian"
  | "inox"
  | "saint"
  | "pendant"
  | "medallion"
  | "scapular";

export type Product = {
  id: string;
  category: ProductCategory;
  label: string;
  image: string;
  sort_order: number;
  active: boolean;
  in_stock: boolean;
  stock_quantity: number | null;
};

export type SiteSettings = {
  whatsapp: string;
  brand_name: string;
  hero_title: string;
  hero_subtitle: string;
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  message_template: string;
  step_labels: string[];
};

export type Catalog = {
  chains: Product[];
  marian: Product[];
  inox: Product[];
  saint: Product[];
  pendants: Product[];
  medallions: Product[];
  scapulars: Product[];
  settings: SiteSettings;
};

export async function fetchCatalog(): Promise<Catalog> {
  const [{ data: products, error: pErr }, { data: settings, error: sErr }] = await Promise.all([
    supabase
      .from("products" as never)
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("site_settings" as never).select("*").eq("id", 1).single(),
  ]);
  if (pErr) throw pErr;
  if (sErr) throw sErr;
  const list = (products ?? []) as unknown as Product[];
  const byCat = (c: ProductCategory) => list.filter((p) => p.category === c);
  return {
    chains: byCat("chain"),
    marian: byCat("marian"),
    inox: byCat("inox"),
    saint: byCat("saint"),
    pendants: byCat("pendant"),
    medallions: byCat("medallion"),
    scapulars: byCat("scapular"),
    settings: settings as unknown as SiteSettings,
  };
}

export function labelOf(list: { id: string; label: string }[], id: string) {
  return list.find((x) => x.id === id)?.label ?? id;
}
