import * as z from "zod";
export const listProductsQuery = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  search:   z.string().trim().optional(),
  category: z.string().trim().optional(),
});
export const createProductBody = z.object({
  name:     z.string().min(1),
  price:    z.number().int().positive(),       // cents
  currency: z.string().length(3).default("USD"),
  category: z.string().min(1),
  inStock:  z.boolean().default(true),
  imageUrl: z.url().optional(),
});
export const productIdParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
