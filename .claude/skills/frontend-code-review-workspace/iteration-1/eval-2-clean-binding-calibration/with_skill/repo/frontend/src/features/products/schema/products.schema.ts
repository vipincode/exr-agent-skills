import * as z from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(), // integer cents
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().url().optional(),
});

export const productListDataSchema = z.object({
  items: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const productsEnvelopeSchema = z.object({
  success: z.literal(true),
  data: productListDataSchema,
  message: z.string().optional(),
});

export const productFiltersSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
});
