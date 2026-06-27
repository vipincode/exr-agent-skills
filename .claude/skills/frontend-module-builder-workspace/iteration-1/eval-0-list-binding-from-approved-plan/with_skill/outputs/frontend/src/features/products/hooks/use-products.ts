import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/products.api";
import type { ProductFilters } from "../types/products";

// API defaults: page 1, limit 20 (the design has no pager yet — first page only for now).
const DEFAULT_FILTERS: ProductFilters = { page: 1, limit: 20 };

export function useProductsQuery(filters: ProductFilters = DEFAULT_FILTERS) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}
