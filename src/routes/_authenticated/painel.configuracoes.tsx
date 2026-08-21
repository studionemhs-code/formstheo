import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { updateSettings } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import type { SiteSettings } from "@/lib/catalog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Upload, X } from "lucide-react";
import { useRef } from "react";

const MAX_LOGO_BYTES = 500 * 1024; // 500 KB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/_authenticated/painel/configuracoes")({
  ssr: false,
  component: SettingsPage,
});

async function loadSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from("site_settings" as never).select("*").eq("id", 1).single();
  if (error) throw error;
  return data as unknown as SiteSettings;
}

function SettingsPage() {
  const qc = useQueryClient();
  const save = useServerFn(updateSettings);
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: loadSettings });
  const [form, setForm] = useState<SiteSettings | null>(null);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const saveM = useMutation({
    mutationFn: () => save({ data: form as SiteSettings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (isLoading || !form) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const F = form;
  const set = (patch: Partial<SiteSettings>) => setForm({ ...F, ...patch });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Marca, cores, títulos e número de WhatsApp.</p>
      </div>

      <Card className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Nome da marca</Label>
            <Input value={F.brand_name} onChange={(e) => set({ brand_name: e.target.value })} />
          </div>
          <div>
            <Label>WhatsApp da loja (DDI + DDD + número, só dígitos)</Label>
            <Input value={F.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Título principal (hero)</Label>
            <Input value={F.hero_title} onChange={(e) => set({ hero_title: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Subtítulo</Label>
            <Input value={F.hero_subtitle} onChange={(e) => set({ hero_subtitle: e.target.value })} />
          </div>
          <div>
            <Label>Cor primária</Label>
            <div className="flex gap-2">
              <Input type="color" value={F.primary_color} onChange={(e) => set({ primary_color: e.target.value })} className="h-10 w-16 p-1" />
              <Input value={F.primary_color} onChange={(e) => set({ primary_color: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Cor de destaque</Label>
            <div className="flex gap-2">
              <Input type="color" value={F.accent_color} onChange={(e) => set({ accent_color: e.target.value })} className="h-10 w-16 p-1" />
              <Input value={F.accent_color} onChange={(e) => set({ accent_color: e.target.value })} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Logo da loja</Label>
            <LogoUpload value={F.logo_url} onChange={(v) => set({ logo_url: v })} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="gap-2">
            {saveM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </Card>
    </div>
  );
}

function LogoUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(`Imagem muito grande. Máximo ${Math.round(MAX_LOGO_BYTES / 1024)} KB`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      onChange(dataUrl);
    } catch {
      toast.error("Falha ao ler o arquivo");
    }
  }

  return (
    <div className="mt-1 space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {value ? "Trocar logo" : "Enviar logo"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" /> Remover
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {value && (
        <div className="inline-flex items-center rounded-md border bg-muted/30 p-3">
          <img src={value} alt="Logo" className="h-16 w-auto object-contain" />
        </div>
      )}
      <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx. {Math.round(MAX_LOGO_BYTES / 1024)} KB.</p>
    </div>
  );
}
