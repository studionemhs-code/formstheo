import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, LayoutDashboard, ShoppingBag, Package, Settings, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/painel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel — Loja Theotokos" },
      { name: "description", content: "Painel administrativo Theotokos." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PanelLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/painel", label: "Início", icon: LayoutDashboard, exact: true },
  { to: "/painel/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/painel/catalogo", label: "Catálogo", icon: Package },
  { to: "/painel/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

function PanelLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const check = useServerFn(checkAdmin);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [signingOut, setSigningOut] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => check(),
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/auth", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSignOut() {
    setSigningOut(true);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta não tem permissão de administrador. Peça a um administrador para conceder o papel <code>admin</code> ao seu usuário.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={handleSignOut} disabled={signingOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">Voltar ao site</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70">Painel</p>
            <h1 className="text-lg font-semibold">Loja Theotokos</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 md:flex-row flex-col">
        <aside className="md:w-56 w-full shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
