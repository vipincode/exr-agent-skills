import { api } from "@/lib/axios";
import { createProductEnvelopeSchema } from "../schema/products.schema";
import type { CreateProductInput, Product } from "../types/products";

/** Request body the backend expects (`createProductBody`): price in CENTS. */
type CreateProductBody = {
  name: string;
  price: number;
  currency: string;
  category: string;
  inStock: boolean;
  imageUrl?: string;
};

/**
 * Map the form input to the API body:
 * - dollars -> positive integer cents (e.g. 24.00 -> 2400)
 * - currency normalized to upper-case ISO 4217
 * - `slug`/`id` are NOT sent (server-derived)
 * - empty `imageUrl` is omitted entirely
 */
function toCreateProductBody(input: CreateProductInput): CreateProductBody {
  const body: CreateProductBody = {
    name: input.name.trim(),
    price: Math.round(input.price * 100),
    currency: input.currency.toUpperCase(),
    category: input.category.trim(),
    inStock: input.inStock,
  };
  if (input.imageUrl) body.imageUrl = input.imageUrl;
  return body;
}

/**
 * Create a product via the BFF proxy (`/api/products` -> backend).
 * Unwraps the success envelope and validates `data` against `productSchema`.
 * Errors propagate to the mutation hook's error state (no swallowing here).
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const res = await api.post("/products", toCreateProductBody(input));
  return createProductEnvelopeSchema.parse(res.data).data;
}
