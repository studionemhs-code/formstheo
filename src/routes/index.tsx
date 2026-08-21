import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Toaster } from "@/components/ui/sonner";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { checkShareToken } from "@/lib/share.functions";
import { Loader2, LinkIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solicitar Orçamento — Loja Theotokos" },
      {
        name: "description",
        content:
          "Personalize sua cadeiazinha Theotokos: escolha modelo, medalhas marianas, pingentes e escapulários e receba seu orçamento pelo WhatsApp.",
      },
      { property: "og:title", content: "Solicitar Orçamento — Loja Theotokos" },
      {
        property: "og:description",
        content:
          "Personalize sua cadeiazinha Theotokos: escolha modelo, medalhas marianas, pingentes e escapulários e receba seu orçamento pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Gate = { status: "loading" | "ok" | "inactive" };

function Index() {
  const check = useServerFn(checkShareToken);
  const [gate, setGate] = useState<Gate>({ status: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("s");
    if (!token) {
      // No share token → open homepage normally, untracked
      setGate({ status: "ok" });
      return;
    }
    let cancelled = false;
    // Never let a slow/failing check block the public form
    const timeout = setTimeout(() => {
      if (!cancelled) setGate((g) => (g.status === "loading" ? { status: "ok" } : g));
    }, 6000);
    check({ data: { token } })
      .then((res) => {
        if (cancelled) return;
        if (res.valid && res.active) setGate({ status: "ok" });
        else setGate({ status: "inactive" });
      })
      .catch(() => !cancelled && setGate({ status: "ok" }));
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [check]);


  if (gate.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (gate.status === "inactive") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <LinkIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Este link não está mais disponível</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O link de orçamento foi desativado. Entre em contato conosco pelo WhatsApp para
            receber um novo link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <QuoteForm />
      <Toaster position="top-center" richColors />
    </main>
  );
}
