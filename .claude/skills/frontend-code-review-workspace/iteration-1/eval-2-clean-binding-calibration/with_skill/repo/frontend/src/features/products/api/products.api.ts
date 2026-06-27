import { api } from "@/lib/axios";
import { productsEnvelopeSchema } from "../schema/products.schema";
import type { ProductFilters } from "../types/products";

export async function fetchProducts(filters?: ProductFilters) {
  const res = await api.get("/products", { params: filters });
  // unwrap the success envelope + fail loudly on contract drift
  return productsEnvelopeSchema.parse(res.data).data;
}
