import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateSettings } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import type { SiteSettings } from "@/lib/catalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel/mensagens")({
  ssr: false,
  component: MessagesPage,
});

async function loadSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings" as never).select("*").eq("id", 1).single();
  if (error) throw error;
  return data as unknown as SiteSettings;
}

function MessagesPage() {
  const qc = useQueryClient();
  const save = useServerFn(updateSettings);
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const [template, setTemplate] = useState("");
  const [labels, setLabels] = useState<string[]>(["", "", "", "", ""]);

  useEffect(() => {
    if (data) {
      setTemplate(data.message_template);
      setLabels(data.step_labels);
    }
  }, [data]);

  const saveM = useMutation({
    mutationFn: () => save({ data: { ...(data as SiteSettings), message_template: template, step_labels: labels } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Mensagens salvas");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Mensagens e textos</h2>
        <p className="text-sm text-muted-foreground">Personalize os textos do formulário e a mensagem enviada ao WhatsApp.</p>
      </div>

      <Card className="p-5">
        <Label>Nomes das etapas (5)</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          {labels.map((l, i) => (
            <input
              key={i}
              value={l}
              onChange={(e) => setLabels(labels.map((x, idx) => (idx === i ? e.target.value : x)))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={40}
            />
          ))}
        </div>

        <div className="mt-6">
          <Label>Cabeçalho da mensagem no WhatsApp</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Este texto aparece antes do resumo automático do pedido. Você pode usar as variáveis:{" "}
            <code>{"{{name}}"}</code>, <code>{"{{whatsapp}}"}</code>, <code>{"{{address}}"}</code>,{" "}
            <code>{"{{items}}"}</code>, <code>{"{{notes}}"}</code>.
          </p>
          <Textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={12}
            className="font-mono text-xs"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="gap-2">
            {saveM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </Card>
    </div>
  );
}
