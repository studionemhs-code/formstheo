import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Item = { id: string; label: string; image: string; in_stock?: boolean; stock_quantity?: number | null };

export function ProductGrid({
  items,
  selected,
  onToggle,
  multi = true,
  columns = 3,
}: {
  items: Item[];
  selected: string[];
  onToggle: (id: string) => void;
  multi?: boolean;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5",
        columns === 2
          ? "grid-cols-2 sm:grid-cols-2"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      )}
    >
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        const soldOut = item.in_stock === false || item.stock_quantity === 0;
        const lowStock =
          typeof item.stock_quantity === "number" && item.stock_quantity > 0 && item.stock_quantity <= 3;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => !soldOut && onToggle(item.id)}
            aria-pressed={isSelected}
            aria-disabled={soldOut}
            disabled={soldOut}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-card text-left transition-all",
              soldOut
                ? "cursor-not-allowed opacity-70"
                : "hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
              isSelected && !soldOut
                ? "border-primary ring-2 ring-primary shadow-lg"
                : "border-border",
            )}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              <img
                src={item.image}
                alt={item.label}
                loading="lazy"
                className={cn(
                  "h-full w-full object-cover transition-transform",
                  soldOut ? "grayscale" : "group-hover:scale-105",
                )}
              />
              {soldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded-md bg-background/95 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-foreground shadow">
                    Esgotado
                  </span>
                </div>
              )}
              {!soldOut && lowStock && (
                <span className="absolute left-2 top-2 rounded-md bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  Últimas {item.stock_quantity}
                </span>
              )}
            </div>
            {isSelected && !soldOut && (
              <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Check className="h-4 w-4" strokeWidth={3} />
              </div>
            )}
            <div className="px-3 py-2.5 text-xs font-medium leading-snug text-foreground sm:text-sm">
              {item.label}
            </div>
            {!multi && (
              <span className="sr-only">{isSelected ? "Selecionado" : "Selecionar"}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

