import * as z from "zod";
import { api } from "@/lib/axios";
import { productsEnvelopeSchema, productSchema, createProductSchema } from "../schema/products.schema";
import type { ProductFilters } from "../types/products";

export async function fetchProducts(filters?: ProductFilters) {
  const res = await api.get("/products", { params: filters });
  // unwrap the success envelope + fail loudly on contract drift
  return productsEnvelopeSchema.parse(res.data).data;
}

const productEnvelopeSchema = z.object({
  success: z.literal(true),
  data: productSchema,
  message: z.string().optional(),
});

export async function createProduct(body: z.infer<typeof createProductSchema>) {
  const res = await api.post("/products", body);
  return productEnvelopeSchema.parse(res.data).data;
}
