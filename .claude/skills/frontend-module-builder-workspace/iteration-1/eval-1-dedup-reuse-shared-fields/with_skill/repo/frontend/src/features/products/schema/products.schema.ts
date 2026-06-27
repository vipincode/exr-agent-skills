import { z } from "zod";

/**
 * Response shape — mirrors the observed backend `ProductDTO`.
 * `price` is stored in CENTS (positive integer). Used to runtime-validate the
 * unwrapped `data` so contract drift fails loudly instead of rendering garbage.
 */
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().url().optional(),
});

/** Success envelope for the create endpoint: `201 { success, data, message }`. */
export const createProductEnvelopeSchema = z.object({
  success: z.literal(true),
  data: productSchema,
  message: z.string().optional(),
});

/** List-data shape (context only — list binding is a separate plan). */
export const productListSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

/**
 * FORM schema. The user enters a human-readable price in DOLLARS; the binding
 * layer converts it to a positive integer in CENTS before POST. `slug`/`id` are
 * server-derived and never submitted.
 */
export const createProductInput = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z
    .string()
    .length(3, "Use a 3-letter currency code")
    .default("USD"),
  category: z.string().min(1, "Category is required"),
  inStock: z.boolean().default(true),
  // optional: allow empty string from the input, otherwise require a valid URL
  imageUrl: z.union([z.literal(""), z.string().url("Enter a valid URL")]).optional(),
});
