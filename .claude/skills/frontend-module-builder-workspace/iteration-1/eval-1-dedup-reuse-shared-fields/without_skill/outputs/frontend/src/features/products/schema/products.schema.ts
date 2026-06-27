import { z } from "zod";

/**
 * Form schema for the admin "create product" form.
 * Mirrors the backend `createProductBody`, but models `price` as a human-entered
 * value (dollars). The dollars -> integer-cents conversion happens in the API fn
 * (`products.api.ts`) right before POST, because the backend requires positive
 * integer cents.
 */
export const createProductInput = z.object({
  name: z.string().min(1, "Name is required"),
  // dollars as entered by the user; coerced from the text input
  price: z.coerce.number().positive("Price must be greater than 0"),
  // ISO 4217 alpha code; backend defaults to USD but we always submit a value
  currency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code")
    .default("USD"),
  category: z.string().min(1, "Category is required"),
  inStock: z.boolean().default(true),
  // optional; allow empty string in the form, dropped before POST
  imageUrl: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type CreateProductInput = z.infer<typeof createProductInput>;

/**
 * Runtime shape of the unwrapped `data` returned by the API (the `ProductDTO`).
 * `price` is an integer in CENTS. Validating here makes contract drift fail loudly.
 */
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().optional(),
});

export type ProductSchema = z.infer<typeof productSchema>;
