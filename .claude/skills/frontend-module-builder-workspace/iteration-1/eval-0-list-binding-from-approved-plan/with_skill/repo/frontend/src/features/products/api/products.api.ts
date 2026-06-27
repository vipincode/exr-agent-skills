import { api } from "@/lib/axios";
import { productsEnvelopeSchema } from "../schema/products.schema";
import type { ProductFilters } from "../types/products";

// Browser → same-origin /api/products → catch-all BFF proxy → backend. Never the backend URL directly.
// Unwrap the success envelope and Zod-parse `data` so contract drift throws instead of rendering garbage.
export async function fetchProducts(filters?: ProductFilters) {
  const res = await api.get("/products", { params: filters });
  return productsEnvelopeSchema.parse(res.data).data;
}
