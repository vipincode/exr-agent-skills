import type { z } from "zod";
import type {
  productSchema,
  productListDataSchema,
  productFiltersSchema,
} from "../schema/products.schema";

// Single source of truth — derived from the Zod schemas (no parallel hand-written interfaces).
export type Product = z.infer<typeof productSchema>;
export type ProductListResponse = z.infer<typeof productListDataSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
