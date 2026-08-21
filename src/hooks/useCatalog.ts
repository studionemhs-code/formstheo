import { useQuery } from "@tanstack/react-query";
import { fetchCatalog, type Catalog } from "@/lib/catalog";

export function useCatalog() {
  return useQuery<Catalog>({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
