import { api } from "@/lib/axios";
import { productSchema, type CreateProductInput } from "../schema/products.schema";
import type { Product } from "../types/products";

/** Backend success envelope: `{ success, data, message }`. */
type ApiEnvelope<T> = { success: boolean; data: T; message: string };

/**
 * Create a product via the BFF proxy (`POST /api/products`).
 *
 * - Converts the human dollar amount to a positive INTEGER in cents.
 * - Omits `imageUrl` when blank; never sends `id`/`slug` (server-derived).
 * - Unwraps the `data` envelope and validates it with `productSchema`.
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const body = {
    name: input.name,
    price: Math.round(input.price * 100), // dollars -> integer cents
    currency: input.currency,
    category: input.category,
    inStock: input.inStock,
    ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
  };

  const res = await api.post<ApiEnvelope<Product>>("/products", body);
  return productSchema.parse(res.data.data);
}
