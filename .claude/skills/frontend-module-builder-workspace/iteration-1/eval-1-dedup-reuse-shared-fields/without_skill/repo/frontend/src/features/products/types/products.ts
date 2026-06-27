import type { z } from "zod";
import type { productSchema } from "../schema/products.schema";

/** Product DTO, derived from the response Zod schema — no parallel interface. */
export type Product = z.infer<typeof productSchema>;

/** Shape of `GET /api/products` `data` (for context / list-cache invalidation). */
export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
};
