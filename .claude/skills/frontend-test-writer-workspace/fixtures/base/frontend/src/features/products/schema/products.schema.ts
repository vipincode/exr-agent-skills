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

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().int().positive("Price must be greater than 0"),
  currency: z.string().length(3).default("USD"),
  category: z.string().min(1, "Category is required"),
  inStock: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
});
