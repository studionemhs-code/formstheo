import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOrders, updateOrderStatus, deleteOrder } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2, ExternalLink, Download, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel/pedidos")({
  ssr: false,
  component: OrdersPage,
});

const STATUSES = ["novo", "em_andamento", "atendido", "fechado", "cancelado"] as const;
const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  atendido: "Atendido",
  fechado: "Fechado",
  cancelado: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  em_andamento: "bg-yellow-100 text-yellow-800",
  atendido: "bg-purple-100 text-purple-800",
  fechado: "bg-green-100 text-green-800",
  cancelado: "bg-gray-200 text-gray-700",
};

type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  whatsapp: string;
  cep: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  chains: unknown;
  medallions: unknown;
  scapulars: unknown;
  notes: string | null;
  status: string;
};

function OrdersPage() {
  const qc = useQueryClient();
  const list = useServerFn(listOrders);
  const upd = useServerFn(updateOrderStatus);
  const del = useServerFn(deleteOrder);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => list() as Promise<Order[]>,
  });

  const updateM = useMutation({
    mutationFn: (v: { id: string; status: string }) => upd({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Status atualizado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setSelected(null);
      toast.success("Pedido removido");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const filtered = (data ?? []).filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      return (
        o.customer_name.toLowerCase().includes(s) ||
        o.whatsapp.includes(s) ||
        (o.city ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  function exportCsv() {
    if (!filtered.length) return toast.info("Nada para exportar");
    const rows = [
      ["Data", "Nome", "WhatsApp", "CEP", "Cidade", "UF", "Status", "Observações"],
      ...filtered.map((o) => [
        new Date(o.created_at).toLocaleString("pt-BR"),
        o.customer_name,
        o.whatsapp,
        o.cep,
        o.city ?? "",
        o.state ?? "",
        STATUS_LABEL[o.status] ?? o.status,
        (o.notes ?? "").replace(/\s+/g, " "),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Pedidos</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} pedido(s)</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <Input
          placeholder="Buscar por nome, whatsapp ou cidade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Cidade</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 font-medium">{o.customer_name}</td>
                    <td className="p-3">{o.whatsapp}</td>
                    <td className="p-3">{o.city ? `${o.city}/${o.state}` : "—"}</td>
                    <td className="p-3">
                      <Badge className={STATUS_COLOR[o.status] ?? "bg-muted"}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setSelected(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <a
                          href={`https://wa.me/${o.whatsapp.replace(/\D/g, "")}`}
                          target="_blank" rel="noreferrer"
                        >
                          <Button size="icon" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">Nenhum pedido encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Pedido de {selected.customer_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={selected.status}
                    onValueChange={(v) => {
                      setSelected({ ...selected, status: v });
                      updateM.mutate({ id: selected.id, status: v });
                    }}
                  >
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selected.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Info label="WhatsApp" value={selected.whatsapp} />
                  <Info label="CEP" value={selected.cep} />
                  <Info label="Endereço" value={`${selected.street ?? ""}, ${selected.number ?? ""}${selected.complement ? " — " + selected.complement : ""}`} />
                  <Info label="Bairro / Cidade" value={`${selected.neighborhood ?? "—"} · ${selected.city ?? "—"}/${selected.state ?? "—"}`} />
                </div>

                <details className="rounded border p-3">
                  <summary className="cursor-pointer font-medium">Itens do pedido</summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
{JSON.stringify({ chains: selected.chains, medallions: selected.medallions, scapulars: selected.scapulars }, null, 2)}
                  </pre>
                </details>

                {selected.notes && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Observações</p>
                    <p className="mt-1">{selected.notes}</p>
                  </div>
                )}

                <div className="flex justify-between border-t pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Remover este pedido?")) deleteM.mutate(selected.id);
                    }}
                    disabled={deleteM.isPending}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Remover
                  </Button>
                  <a
                    href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`}
                    target="_blank" rel="noreferrer"
                  >
                    <Button className="gap-2"><ExternalLink className="h-4 w-4" /> Abrir WhatsApp</Button>
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}
