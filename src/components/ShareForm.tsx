import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getShareLink,
  updateShareLink,
  regenerateShareToken,
  resetShareStats,
  recordShareClick,
} from "@/lib/share.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Copy,
  Check,
  Share2,
  QrCode,
  ExternalLink,
  RefreshCw,
  Save,
  Loader2,
  Eye,
  Send,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export function ShareForm() {
  const qc = useQueryClient();
  const fetchLink = useServerFn(getShareLink);
  const saveFn = useServerFn(updateShareLink);
  const regenFn = useServerFn(regenerateShareToken);
  const resetFn = useServerFn(resetShareStats);
  const recordFn = useServerFn(recordShareClick);

  const { data, isLoading } = useQuery({
    queryKey: ["share_link"],
    queryFn: () => fetchLink(),
    refetchOnWindowFocus: true,
  });

  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  useEffect(() => {
    if (data?.message) setMessage(data.message);
  }, [data?.message]);

  const url = useMemo(
    () => (data?.token && origin ? `${origin}/?s=${data.token}` : ""),
    [data?.token, origin],
  );

  const filledMessage = useMemo(
    () => (message ? message.replace(/\{url\}/g, url) : url),
    [message, url],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["share_link"] });

  const saveMsg = useMutation({
    mutationFn: () => saveFn({ data: { message } }),
    onSuccess: () => {
      invalidate();
      toast.success("Mensagem salva");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const toggleActive = useMutation({
    mutationFn: (active: boolean) => saveFn({ data: { active } }),
    onSuccess: (_, active) => {
      invalidate();
      toast.success(active ? "Link ativado" : "Link desativado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const regenerate = useMutation({
    mutationFn: () => regenFn(),
    onSuccess: () => {
      invalidate();
      toast.success("Novo link gerado. O link anterior foi invalidado.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const resetStats = useMutation({
    mutationFn: () => resetFn(),
    onSuccess: () => {
      invalidate();
      toast.success("Estatísticas zeradas");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const trackShare = () => {
    if (data?.token) recordFn({ data: { token: data.token } }).catch(() => {});
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare();
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const shareWhats = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(filledMessage)}`, "_blank");
    trackShare();
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Solicite seu orçamento", text: filledMessage, url });
        trackShare();
      } catch {
        /* cancelled */
      }
    } else {
      copyUrl();
    }
  };

  const confirmAndRun = (msg: string, fn: () => void) => {
    if (window.confirm(msg)) fn();
  };

  const qrSrc = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
    : "";

  if (isLoading || !data) {
    return (
      <Card className="mb-6 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  const isActive = data.active;

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Share2 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Link compartilhável da homepage</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Compartilhe este link com seus clientes. Você pode desativá-lo ou gerar um novo
                a qualquer momento.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-muted-foreground"}`}
                />
                {isActive ? "Ativo" : "Desativado"}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={(v) => toggleActive.mutate(v)}
                disabled={toggleActive.isPending}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> Acessos
              </div>
              <div className="mt-1 text-2xl font-semibold">{data.visits}</div>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Send className="h-3.5 w-3.5" /> Compartilhamentos
              </div>
              <div className="mt-1 text-2xl font-semibold">{data.shares}</div>
            </div>
            <div className="col-span-2 flex items-end justify-end sm:col-span-1">
              <Button
                onClick={() =>
                  confirmAndRun("Zerar todas as estatísticas do link?", () => resetStats.mutate())
                }
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                disabled={resetStats.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Zerar contadores
              </Button>
            </div>
          </div>

          {/* URL row */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input value={url} readOnly className="font-mono text-xs sm:text-sm" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyUrl} variant="secondary" className="gap-2" disabled={!isActive}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>

          {/* Share actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={shareWhats}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!isActive}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar no WhatsApp
            </Button>
            <Button
              onClick={nativeShare}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!isActive}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar…
            </Button>
            <Button
              onClick={() => setShowQr((v) => !v)}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={!isActive}
            >
              <QrCode className="h-4 w-4" />
              {showQr ? "Ocultar QR Code" : "Mostrar QR Code"}
            </Button>
            <Button
              onClick={() =>
                confirmAndRun(
                  "Gerar um novo link? O link atual deixará de funcionar e os contadores serão zerados.",
                  () => regenerate.mutate(),
                )
              }
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={regenerate.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${regenerate.isPending ? "animate-spin" : ""}`} />
              Regenerar link
            </Button>
          </div>

          {showQr && qrSrc && (
            <div className="mt-4 flex flex-col items-start gap-2">
              <img
                src={qrSrc}
                alt="QR code do formulário"
                className="rounded-md border bg-white p-2"
                width={240}
                height={240}
              />
              <a
                href={qrSrc}
                download="qrcode-formulario.png"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Baixar QR Code
              </a>
            </div>
          )}

          {/* Editable message */}
          <div className="mt-6 border-t pt-4">
            <Label className="text-sm font-medium">
              Mensagem pré-preenchida ao compartilhar
            </Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Este texto aparece no WhatsApp e no compartilhamento nativo. Use{" "}
              <code className="rounded bg-muted px-1">{"{url}"}</code> onde o link deve aparecer.
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              className="text-sm"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                <span className="font-medium text-foreground">Prévia:</span> {filledMessage}
              </p>
              <Button
                onClick={() => saveMsg.mutate()}
                disabled={saveMsg.isPending || message === data.message}
                size="sm"
                className="gap-2 shrink-0"
              >
                {saveMsg.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar mensagem
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
