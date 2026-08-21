import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Package, Settings, MessageSquare } from "lucide-react";
import { ShareForm } from "@/components/ShareForm";

export const Route = createFileRoute("/_authenticated/painel/")({
  ssr: false,
  component: PanelHome,
});

const ITEMS = [
  { to: "/painel/pedidos", title: "Pedidos", desc: "Ver, filtrar e atualizar status dos orçamentos recebidos.", icon: ShoppingBag },
  { to: "/painel/catalogo", title: "Catálogo", desc: "Adicionar, editar ou remover produtos e imagens.", icon: Package },
  { to: "/painel/mensagens", title: "Mensagens", desc: "Personalizar o texto enviado ao WhatsApp.", icon: MessageSquare },
  { to: "/painel/configuracoes", title: "Configurações", desc: "Marca, cores, títulos e número de WhatsApp.", icon: Settings },
] as const;

function PanelHome() {
  return (
    <div>
      <h2 className="mb-1 text-2xl font-semibold">Bem-vindo(a) 👋</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Gerencie seus orçamentos, catálogo e a personalização do formulário.
      </p>
      <ShareForm />
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((it) => (
          <Link key={it.to} to={it.to as never}>
            <Card className="group h-full p-5 transition hover:border-primary hover:shadow-md">
              <it.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold group-hover:text-primary">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
