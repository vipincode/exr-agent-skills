import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/products.api";
import type { ProductFilters } from "../types/products";

// Server supports paged queries; bind the first page with the API default limit.
const DEFAULT_FILTERS: ProductFilters = { page: 1, limit: 20 };

// Query key is feature-namespaced and includes filters: ["products", filters].
export function useProductsQuery(filters: ProductFilters = DEFAULT_FILTERS) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}
