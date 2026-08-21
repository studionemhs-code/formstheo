import { createContext, useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { ProductGrid } from "./ProductGrid";
import { newChain, quoteSchema, type Chain, type QuoteInput } from "@/lib/quote-schema";
import { submitQuoteRequest } from "@/lib/quote.functions";
import { useServerFn } from "@tanstack/react-start";
import { useCatalog } from "@/hooks/useCatalog";
import type { Catalog } from "@/lib/catalog";

const CatalogCtx = createContext<Catalog | null>(null);
function useCat(): Catalog {
  const c = useContext(CatalogCtx);
  if (!c) throw new Error("Catalog not loaded");
  return c;
}


function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) =>
    [a && `(${a}`, a && a.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""),
  );
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
}
function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function labelOf(list: { id: string; label: string }[], id: string) {
  return list.find((x) => x.id === id)?.label ?? id;
}

export function QuoteForm() {
  const { data: cat, isLoading, error } = useCatalog();
  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (error || !cat) {
    return <div className="mx-auto max-w-lg p-8 text-center text-sm text-muted-foreground">Não foi possível carregar o catálogo. Recarregue a página.</div>;
  }
  return <CatalogCtx.Provider value={cat}><QuoteFormInner /></CatalogCtx.Provider>;
}

function QuoteFormInner() {
  const cat = useCat();
  const rawLabels = cat.settings.step_labels;
  // etapa 1 (dados) unificada com etapa 2 (cadeiazinhas)
  const STEPS =
    rawLabels.length > 1
      ? [`${rawLabels[0]} e ${rawLabels[1]}`, ...rawLabels.slice(2)]
      : rawLabels;
  const submit = useServerFn(submitQuoteRequest);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [form, setForm] = useState<QuoteInput>({
    customerName: "",
    whatsapp: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    chains: [newChain()],
    medallions: [],
    scapulars: [],
    notes: "",
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) {
      if (digits.length > 0) toast.error("CEP deve conter 8 dígitos");
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        street: f.street || data.logradouro || "",
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch {
      toast.error("Não foi possível buscar o CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  }
  async function handleCepBlur() {
    await lookupCep(form.cep);
  }

  function updateChain(index: number, patch: Partial<Chain>) {
    setForm((f) => ({
      ...f,
      chains: f.chains.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }
  function toggleInArray(arr: string[], id: string) {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (form.customerName.trim().length < 2) return "Informe seu nome";
      if (form.whatsapp.replace(/\D/g, "").length < 10) return "Informe um WhatsApp válido";
      if (!/^\d{5}-?\d{3}$/.test(form.cep)) return "CEP inválido";
      if (form.street.trim().length < 2) return "Informe a rua";
      if (form.number.trim().length < 1) return "Informe o número";
      for (const [i, c] of form.chains.entries()) {
        if (!c.model) return `Cadeiazinha ${i + 1}: escolha um modelo`;
        if (!c.freeMedal) return `Cadeiazinha ${i + 1}: escolha a medalha de brinde`;
      }
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildWhatsAppMessage(): string {
    const lines: string[] = [];
    lines.push("*Solicitação de Orçamento — Theotokos*", "");
    lines.push(`*Nome:* ${form.customerName}`);
    lines.push(`*WhatsApp:* ${form.whatsapp}`);
    lines.push(
      `*Endereço:* ${form.street}, ${form.number}${form.complement ? ` — ${form.complement}` : ""}${form.neighborhood ? ` · ${form.neighborhood}` : ""}${form.city ? ` · ${form.city}` : ""}${form.state ? `/${form.state}` : ""} · CEP ${form.cep}`,
    );
    lines.push("");
    form.chains.forEach((c, i) => {
      lines.push(`*Cadeiazinha ${i + 1}*`);
      lines.push(`• Modelo: ${labelOf(cat.chains, c.model)}`);
      lines.push(`• Tamanho: ${c.size?.trim() || "21 cm (padrão)"}`);
      lines.push(`• Medalha de brinde: ${labelOf(cat.marian, c.freeMedal)}`);
      if (c.marianMedals.length)
        lines.push(`• Medalhas marianas: ${c.marianMedals.map((id) => labelOf(cat.marian, id)).join(", ")}`);
      if (c.inoxMedals.length)
        lines.push(`• Medalhas inox: ${c.inoxMedals.map((id) => labelOf(cat.inox, id)).join(", ")}`);
      if (c.saintMedals.length)
        lines.push(`• Medalhas de santos: ${c.saintMedals.map((id) => labelOf(cat.saint, id)).join(", ")}`);
      if (c.pendants.length)
        lines.push(`• Pingentes: ${c.pendants.map((id) => labelOf(cat.pendants, id)).join(", ")}`);
      lines.push("");
    });
    if (form.medallions.length) {
      lines.push("*Medalhões / Corrente de Pescoço*");
      form.medallions.forEach((m) =>
        lines.push(`• ${labelOf(cat.medallions, m.id)} — ${m.withChain === "com" ? "com corrente" : "sem corrente"}`),
      );
      lines.push("");
    }
    if (form.scapulars.length) {
      lines.push("*Escapulários*");
      form.scapulars.forEach((s) => lines.push(`• ${labelOf(cat.scapulars, s.id)} — ${s.quantity}x`));
      lines.push("");
    }
    if (form.notes?.trim()) {
      lines.push(`*Observações:* ${form.notes.trim()}`);
    }
    lines.push("", "_Salve Maria Imaculada!_");
    return lines.join("\n");
  }

  async function handleSubmit() {
    const parsed = quoteSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique o formulário");
      return;
    }
    setSubmitting(true);
    try {
      await submit({ data: parsed.data });
      const msg = buildWhatsAppMessage();
      const url = `https://wa.me/${cat.settings.whatsapp}?text=${encodeURIComponent(msg)}`;
      toast.success("Solicitação registrada! Abrindo WhatsApp…");
      window.location.assign(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
          Loja Theotokos
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
          Personalize sua Cadeiazinha
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Monte sua peça e receba um orçamento completo pelo WhatsApp — com frete e formas de pagamento.
        </p>
      </header>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span className="text-primary">{STEPS[step]}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card className="border-border/60 bg-card p-5 shadow-sm sm:p-8 lg:p-10">
        {step === 0 && (
          <div className="space-y-10">
            <StepCustomer form={form} setForm={setForm} onCepBlur={handleCepBlur} lookupCep={lookupCep} cepLoading={cepLoading} />
            <div className="border-t border-border/60 pt-8">
              <StepChains
                chains={form.chains}
                updateChain={updateChain}
                addChain={() => setForm((f) => ({ ...f, chains: [...f.chains, newChain()] }))}
                removeChain={(i) =>
                  setForm((f) => ({
                    ...f,
                    chains: f.chains.length > 1 ? f.chains.filter((_, idx) => idx !== i) : f.chains,
                  }))
                }
                toggleInArray={toggleInArray}
              />
            </div>
          </div>
        )}
        {step === 1 && (
          <StepMedallions
            medallions={form.medallions}
            setMedallions={(m) => setForm((f) => ({ ...f, medallions: m }))}
          />
        )}
        {step === 2 && (
          <StepScapulars
            scapulars={form.scapulars}
            setScapulars={(s) => setForm((f) => ({ ...f, scapulars: s }))}
          />
        )}
        {step === 3 && <StepReview form={form} setNotes={(v) => setForm((f) => ({ ...f, notes: v }))} />}
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={prev}
          disabled={step === 0 || submitting}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next} className="gap-1">
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar no WhatsApp
          </Button>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Salve Maria Imaculada! · Equipe Theotokos
      </p>
    </div>
  );
}

/* ---------- Step 0 ---------- */
function StepCustomer({
  form,
  setForm,
  onCepBlur,
  lookupCep,
  cepLoading,
}: {
  form: QuoteInput;
  setForm: React.Dispatch<React.SetStateAction<QuoteInput>>;
  onCepBlur: () => void;
  lookupCep: (cep: string) => void;
  cepLoading: boolean;
}) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Suas informações" subtitle="Para calcularmos o frete e retornarmos com o orçamento." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo" required>
          <Input
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            placeholder="Como podemos te chamar?"
            maxLength={120}
          />
        </Field>
        <Field label="WhatsApp" required>
          <Input
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
            placeholder="(00) 00000-0000"
            inputMode="tel"
          />
        </Field>
        <Field label="CEP" required>
          <div className="relative">
            <Input
              value={form.cep}
              onChange={(e) => {
                const masked = maskCep(e.target.value);
                setForm((f) => ({ ...f, cep: masked }));
                if (masked.replace(/\D/g, "").length === 8) lookupCep(masked);
              }}
              onBlur={onCepBlur}
              placeholder="00000-000"
              inputMode="numeric"
              disabled={cepLoading}
              className={cepLoading ? "pr-9" : undefined}
            />
            {cepLoading && (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>
        </Field>
        <Field label="Rua" required>
          <Input
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            placeholder="Nome da rua / avenida"
            maxLength={160}
            disabled={cepLoading}
          />
        </Field>
        <Field label="Número" required>
          <Input
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            placeholder="Ex.: 123"
            maxLength={20}
            disabled={cepLoading}
          />
        </Field>
        <Field label="Complemento">
          <Input
            value={form.complement}
            onChange={(e) => setForm((f) => ({ ...f, complement: e.target.value }))}
            placeholder="Apto, bloco, referência…"
            maxLength={120}
            disabled={cepLoading}
          />
        </Field>
        <Field label="Bairro">
          <Input
            value={form.neighborhood}
            onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
            disabled={cepLoading}
          />
        </Field>
        <Field label="Cidade">
          <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} disabled={cepLoading} />
        </Field>
        <Field label="Estado">
          <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} disabled={cepLoading} />
        </Field>
      </div>
    </div>
  );
}

/* ---------- Step 1 ---------- */
function StepChains({
  chains,
  updateChain,
  addChain,
  removeChain,
  toggleInArray,
}: {
  chains: Chain[];
  updateChain: (i: number, patch: Partial<Chain>) => void;
  addChain: () => void;
  removeChain: (i: number) => void;
  toggleInArray: (arr: string[], id: string) => string[];
}) {
  const cat = useCat();
  return (
    <div className="space-y-10">
      <SectionTitle
        title="Suas cadeiazinhas"
        subtitle="Adicione quantas cadeiazinhas quiser — cada uma com seu modelo e medalhas."
      />
      {chains.map((c, i) => (
        <div key={i} className="rounded-xl border border-border/70 bg-background/60 p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary sm:text-xl">Cadeiazinha {i + 1}</h3>
            {chains.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeChain(i)}
                className="gap-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Remover
              </Button>
            )}
          </div>

          <SubTitle hint="Escolha 1 modelo de corrente.">Modelo da corrente</SubTitle>
          <ProductGrid
            items={cat.chains}
            selected={c.model ? [c.model] : []}
            onToggle={(id) => updateChain(i, { model: id === c.model ? "" : id })}
            multi={false}
          />

          <div className="mt-6">
            <Field label="Tamanho (opcional — padrão 21 cm)">
              <Input
                value={c.size ?? ""}
                onChange={(e) => updateChain(i, { size: e.target.value })}
                placeholder="Ex.: 19 cm"
                maxLength={50}
              />
            </Field>
          </div>

          <hr className="my-8 border-border/50" />

          <SubTitle hint="Todas as correntes acompanham uma medalha mariana de brinde. Escolha 1.">
            Medalha mariana de brinde
          </SubTitle>
          <ProductGrid
            items={cat.marian}
            selected={c.freeMedal ? [c.freeMedal] : []}
            onToggle={(id) => updateChain(i, { freeMedal: id === c.freeMedal ? "" : id })}
            multi={false}
          />

          <hr className="my-8 border-border/50" />

          <SubTitle
            hint="Escolha quantas quiser para compor sua cadeiazinha."
            count={c.marianMedals.length}
          >
            Medalhas marianas adicionais
          </SubTitle>
          <ProductGrid
            items={cat.marian}
            selected={c.marianMedals}
            onToggle={(id) => updateChain(i, { marianMedals: toggleInArray(c.marianMedals, id) })}
          />

          <hr className="my-8 border-border/50" />

          <SubTitle count={c.inoxMedals.length}>
            Medalhas / pingentes em aço inox
          </SubTitle>
          <ProductGrid
            items={cat.inox}
            selected={c.inoxMedals}
            onToggle={(id) => updateChain(i, { inoxMedals: toggleInArray(c.inoxMedals, id) })}
          />

          <hr className="my-8 border-border/50" />

          <SubTitle count={c.saintMedals.length}>Medalhas de santos e santas</SubTitle>
          <ProductGrid
            items={cat.saint}
            selected={c.saintMedals}
            onToggle={(id) => updateChain(i, { saintMedals: toggleInArray(c.saintMedals, id) })}
          />

          <hr className="my-8 border-border/50" />

          <SubTitle count={c.pendants.length}>Pingentes diversos</SubTitle>
          <ProductGrid
            items={cat.pendants}
            selected={c.pendants}
            onToggle={(id) => updateChain(i, { pendants: toggleInArray(c.pendants, id) })}
          />
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addChain} className="w-full gap-2 border-dashed">
        <Plus className="h-4 w-4" /> Adicionar outra cadeiazinha
      </Button>
    </div>
  );
}

/* ---------- Step 2 ---------- */
function StepMedallions({
  medallions,
  setMedallions,
}: {
  medallions: QuoteInput["medallions"];
  setMedallions: (m: QuoteInput["medallions"]) => void;
}) {
  const cat = useCat();
  const selectedIds = medallions.map((m) => m.id);
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Medalhões e Cruz do Perdão"
        subtitle="Opcional. Se escolher, indique se deseja com ou sem corrente de pescoço."
      />
      <ProductGrid
        items={cat.medallions}
        selected={selectedIds}
        onToggle={(id) => {
          if (selectedIds.includes(id)) setMedallions(medallions.filter((m) => m.id !== id));
          else setMedallions([...medallions, { id, withChain: "com" }]);
        }}
      />
      {medallions.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border/70 bg-background/60 p-4">
          {medallions.map((m) => {
            const label = labelOf(cat.medallions, m.id);
            return (
              <div key={m.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">{label}</span>
                <div className="flex gap-2">
                  {(["com", "sem"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setMedallions(medallions.map((x) => (x.id === m.id ? { ...x, withChain: opt } : x)))
                      }
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                        m.withChain === opt
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/60"
                      }`}
                    >
                      {opt === "com" ? "Com corrente" : "Sem corrente"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Step 3 ---------- */
function StepScapulars({
  scapulars,
  setScapulars,
}: {
  scapulars: QuoteInput["scapulars"];
  setScapulars: (s: QuoteInput["scapulars"]) => void;
}) {
  const cat = useCat();
  const selectedIds = scapulars.map((s) => s.id);
  return (
    <div className="space-y-5">
      <SectionTitle
        title="Escapulários de Lã de Carneiro"
        subtitle="Opcional. Escapulários de N.S. do Carmo — Beleza e Resistência Theotokos."
      />
      <ProductGrid
        items={cat.scapulars}
        selected={selectedIds}
        columns={2}
        onToggle={(id) => {
          if (selectedIds.includes(id)) setScapulars(scapulars.filter((s) => s.id !== id));
          else setScapulars([...scapulars, { id, quantity: 1 }]);
        }}
      />
      {scapulars.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border/70 bg-background/60 p-4">
          {scapulars.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-sm font-medium">{labelOf(cat.scapulars, s.id)}</span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() =>
                    setScapulars(
                      scapulars.map((x) =>
                        x.id === s.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x,
                      ),
                    )
                  }
                >
                  −
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{s.quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() =>
                    setScapulars(
                      scapulars.map((x) =>
                        x.id === s.id ? { ...x, quantity: Math.min(20, x.quantity + 1) } : x,
                      ),
                    )
                  }
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Step 4 ---------- */
function StepReview({ form, setNotes }: { form: QuoteInput; setNotes: (v: string) => void }) {
  const cat = useCat();
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Revise seu pedido"
        subtitle="Ao enviar, salvamos sua solicitação e abrimos o WhatsApp com o resumo pronto."
      />

      <div className="rounded-lg border bg-background/60 p-4 text-sm">
        <p><strong>{form.customerName}</strong> · {form.whatsapp}</p>
        <p className="text-muted-foreground">
          {form.street}, {form.number}
          {form.complement && ` — ${form.complement}`}
          {form.neighborhood && ` · ${form.neighborhood}`}
          {form.city && ` · ${form.city}`}
          {form.state && `/${form.state}`}
          {` · CEP ${form.cep}`}
        </p>
      </div>

      {form.chains.map((c, i) => (
        <div key={i} className="rounded-lg border bg-background/60 p-4 text-sm">
          <p className="mb-1 font-semibold text-primary">Cadeiazinha {i + 1}</p>
          <p>Modelo: {labelOf(cat.chains, c.model)}</p>
          <p>Tamanho: {c.size?.trim() || "21 cm (padrão)"}</p>
          <p>Brinde: {labelOf(cat.marian, c.freeMedal)}</p>
          {c.marianMedals.length > 0 && (
            <p>Marianas: {c.marianMedals.map((id) => labelOf(cat.marian, id)).join(", ")}</p>
          )}
          {c.inoxMedals.length > 0 && (
            <p>Inox: {c.inoxMedals.map((id) => labelOf(cat.inox, id)).join(", ")}</p>
          )}
          {c.saintMedals.length > 0 && (
            <p>Santos: {c.saintMedals.map((id) => labelOf(cat.saint, id)).join(", ")}</p>
          )}
          {c.pendants.length > 0 && (
            <p>Pingentes: {c.pendants.map((id) => labelOf(cat.pendants, id)).join(", ")}</p>
          )}
        </div>
      ))}

      {form.medallions.length > 0 && (
        <div className="rounded-lg border bg-background/60 p-4 text-sm">
          <p className="mb-1 font-semibold text-primary">Medalhões</p>
          {form.medallions.map((m) => (
            <p key={m.id}>
              {labelOf(cat.medallions, m.id)} — {m.withChain === "com" ? "com corrente" : "sem corrente"}
            </p>
          ))}
        </div>
      )}

      {form.scapulars.length > 0 && (
        <div className="rounded-lg border bg-background/60 p-4 text-sm">
          <p className="mb-1 font-semibold text-primary">Escapulários</p>
          {form.scapulars.map((s) => (
            <p key={s.id}>
              {labelOf(cat.scapulars, s.id)} — {s.quantity}x
            </p>
          ))}
        </div>
      )}

      <Field label="Observações (opcional)">
        <Textarea
          value={form.notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alguma preferência ou pedido especial?"
          maxLength={1000}
          rows={3}
        />
      </Field>
    </div>
  );
}

/* ---------- shared ---------- */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b border-[var(--gold)]/40 pb-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
function SubTitle({
  children,
  className = "",
  count,
  hint,
}: {
  children: React.ReactNode;
  className?: string;
  count?: number;
  hint?: string;
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-baseline justify-between gap-2 border-l-2 border-primary/60 pl-3 ${className}`}>
      <div className="min-w-0">
        <h4 className="text-base font-semibold text-foreground sm:text-lg">
          {children}
        </h4>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {typeof count === "number" && count > 0 && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {count} {count === 1 ? "selecionada" : "selecionadas"}
        </span>
      )}
    </div>
  );
}
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  );
}
