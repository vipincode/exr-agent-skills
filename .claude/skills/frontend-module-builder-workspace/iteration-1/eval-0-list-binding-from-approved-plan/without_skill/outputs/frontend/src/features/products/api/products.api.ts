import { api } from "@/lib/axios";
import { productsEnvelopeSchema } from "../schema/products.schema";
import type { ProductFilters, ProductListResponse } from "../types/products";

// Browser -> same-origin /api/products (via the BFF catch-all proxy) -> backend.
// Unwraps the { success, data, message } envelope and Zod-validates before returning `data`.
export async function fetchProducts(
  filters: ProductFilters = {},
): Promise<ProductListResponse> {
  const res = await api.get("/products", { params: filters });
  const parsed = productsEnvelopeSchema.parse(res.data);
  return parsed.data;
}
