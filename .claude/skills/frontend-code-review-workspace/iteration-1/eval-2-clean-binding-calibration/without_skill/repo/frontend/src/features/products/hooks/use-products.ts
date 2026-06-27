import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchProducts } from "../api/products.api";
import type { ProductFilters } from "../types/products";

export function useProductsQuery(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData,
  });
}
