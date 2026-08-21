import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllProducts, upsertProduct, deleteProduct } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel/catalogo")({
  ssr: false,
  component: CatalogPage,
});

const CATEGORIES = [
  { id: "chain", label: "Modelos de cadeiazinha" },
  { id: "marian", label: "Medalhas marianas" },
  { id: "inox", label: "Medalhas em inox" },
  { id: "saint", label: "Medalhas de santos" },
  { id: "pendant", label: "Pingentes" },
  { id: "medallion", label: "Medalhões" },
  { id: "scapular", label: "Escapulários" },
] as const;

type Cat = typeof CATEGORIES[number]["id"];
type Product = {
  id: string;
  category: Cat;
  label: string;
  image: string;
  sort_order: number;
  active: boolean;
  in_stock: boolean;
  stock_quantity: number | null;
};

const EMPTY: Product = { id: "", category: "chain", label: "", image: "", sort_order: 0, active: true, in_stock: true, stock_quantity: null };

const MAX_IMAGE_BYTES = 800 * 1024; // 800 KB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function CatalogPage() {
  const qc = useQueryClient();
  const list = useServerFn(listAllProducts);
  const save = useServerFn(upsertProduct);
  const del = useServerFn(deleteProduct);

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => list() as Promise<Product[]>,
  });

  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const saveM = useMutation({
    mutationFn: (p: Product) => save({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setEditing(null);
      toast.success("Salvo");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Removido");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const grouped = useMemo(() => {
    const g: Record<string, Product[]> = {};
    (data ?? []).forEach((p) => {
      (g[p.category] ??= []).push(p);
    });
    return g;
  }, [data]);

  function openNew(cat: Cat) {
    setIsNew(true);
    setEditing({ ...EMPTY, category: cat });
  }
  function openEdit(p: Product) {
    setIsNew(false);
    setEditing(p);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Catálogo</h2>
        <p className="text-sm text-muted-foreground">Gerencie os produtos exibidos no formulário.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Tabs defaultValue="chain">
          <TabsList className="mb-4 flex-wrap h-auto">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((c) => (
            <TabsContent key={c.id} value={c.id}>
              <div className="mb-3 flex justify-end">
                <Button onClick={() => openNew(c.id)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Novo produto
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(grouped[c.id] ?? []).map((p) => (
                  <Card key={p.id} className={`p-3 ${p.active ? "" : "opacity-60"}`}>
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0">
                        <img
                          src={p.image}
                          alt={p.label}
                          className="h-16 w-16 rounded object-cover"
                        />
                        {(!p.in_stock || p.stock_quantity === 0) && (
                          <span className="absolute inset-0 flex items-center justify-center rounded bg-black/50 text-[10px] font-semibold uppercase text-white">
                            Esgotado
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.id}</p>
                        <p className="text-xs text-muted-foreground">
                          Ordem: {p.sort_order}
                          {!p.active && " · inativo"}
                          {p.stock_quantity === null
                            ? p.in_stock ? " · disponível" : " · esgotado"
                            : ` · estoque: ${p.stock_quantity}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => { if (confirm(`Remover "${p.label}"?`)) delM.mutate(p.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {!(grouped[c.id] ?? []).length && (
                  <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    Nenhum produto nesta categoria.
                  </p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? "Novo produto" : "Editar produto"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveM.mutate(editing);
              }}
            >
              <div>
                <Label>Identificador (slug)</Label>
                <Input
                  value={editing.id}
                  onChange={(e) => setEditing({ ...editing, id: e.target.value.toLowerCase() })}
                  disabled={!isNew}
                  placeholder="ex: aparecida-inox"
                  required
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editing.category}
                  onValueChange={(v) => setEditing({ ...editing, category: v as Cat })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome exibido</Label>
                <Input
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  required
                />
              </div>
              <div>

                <Label>Imagem</Label>
                <div className="mt-1 space-y-2">
                  {editing.image && (
                    <img src={editing.image} alt="" className="h-32 w-32 rounded border object-cover" />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > MAX_IMAGE_BYTES) {
                          toast.error("Imagem muito grande (máx. 800 KB)");
                          e.target.value = "";
                          return;
                        }
                        try {
                          const dataUrl = await readAsDataUrl(f);
                          setEditing((prev) => (prev ? { ...prev, image: dataUrl } : prev));
                        } catch {
                          toast.error("Falha ao ler a imagem");
                        } finally {
                          e.target.value = "";
                        }
                      }}
                      className="max-w-xs"
                    />
                    {editing.image && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing({ ...editing, image: "" })}
                      >
                        Remover imagem
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP ou SVG até 800 KB. Ou cole uma URL abaixo.
                  </p>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={editing.image.startsWith("data:") ? "" : editing.image}
                    onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-3 pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.active}
                      onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                    />
                    <Label>Ativo (visível no site)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.in_stock}
                      onCheckedChange={(v) => setEditing({ ...editing, in_stock: v })}
                    />
                    <Label>{editing.in_stock ? "Disponível" : "Esgotado"}</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label>Quantidade em estoque</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Deixe vazio para não controlar estoque"
                  value={editing.stock_quantity ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditing({
                      ...editing,
                      stock_quantity: v === "" ? null : Math.max(0, Math.floor(Number(v))),
                    });
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {editing.stock_quantity === null
                    ? "Sem controle de estoque — usa o interruptor Disponível/Esgotado."
                    : editing.stock_quantity === 0
                      ? "Estoque zerado — o produto será exibido como Esgotado."
                      : `Serão exibidas ${editing.stock_quantity} unidade(s) em estoque.`}
                </p>
              </div>
              <Button
                type="submit"
                disabled={saveM.isPending || !editing.image}
                className="w-full gap-2"
              >
                {saveM.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
