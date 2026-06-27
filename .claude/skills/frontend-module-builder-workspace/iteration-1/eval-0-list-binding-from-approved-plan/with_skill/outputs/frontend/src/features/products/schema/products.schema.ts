import { z } from "zod";

// Mirrors the observed backend ProductDTO exactly (see _docs/FEATURE_PLAN_products.md).
// price is integer CENTS; currency is an ISO-4217 code. No createdAt/updatedAt — the DTO omits them.
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(), // integer cents, e.g. 2400
  currency: z.string(), // ISO-4217, e.g. "USD"
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().url().optional(),
});

// GET /api/products `data` shape (paged list).
export const productListDataSchema = z.object({
  items: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Success envelope { success: true, data, message } — parse so envelope/field drift fails loudly.
export const productsEnvelopeSchema = z.object({
  success: z.literal(true),
  data: productListDataSchema,
  message: z.string().optional(),
});

// Query args for the list endpoint (page/limit/search/category) — search/category not wired in this pass.
export const productFiltersSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
});
