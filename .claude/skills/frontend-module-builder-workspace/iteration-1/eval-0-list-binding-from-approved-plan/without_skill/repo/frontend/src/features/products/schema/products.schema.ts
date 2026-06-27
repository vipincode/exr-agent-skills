import { z } from "zod";

// Mirrors the backend ProductDTO exactly (backend/src/modules/products/products.service.ts).
// price is an INTEGER amount in CENTS (e.g. 2400) paired with an ISO-4217 `currency`.
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.url().optional(),
});

// data shape of GET /api/products
export const productListDataSchema = z.object({
  items: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Full success envelope from src/lib/app-response.ts -> ok(): { success, data, message }.
// Parsing the whole envelope makes field/envelope drift fail loudly.
export const productsEnvelopeSchema = z.object({
  success: z.literal(true),
  data: productListDataSchema,
  message: z.string(),
});

// Optional query args for the list endpoint (page/limit/search/category).
export const productFiltersSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
});
