import type { z } from "zod";
import type {
  productSchema,
  productListDataSchema,
  productFiltersSchema,
} from "../schema/products.schema";

// Types are derived from the Zod schemas — no parallel interfaces (per ARCHITECTURE.md).
export type Product = z.infer<typeof productSchema>;
export type ProductListResponse = z.infer<typeof productListDataSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
