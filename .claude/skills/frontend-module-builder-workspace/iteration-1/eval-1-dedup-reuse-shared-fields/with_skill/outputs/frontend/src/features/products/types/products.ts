import { z } from "zod";
import {
  productSchema,
  productListSchema,
  createProductInput,
} from "../schema/products.schema";

/** Domain type — single source of truth derived from the Zod schema. */
export type Product = z.infer<typeof productSchema>;

/** Paged list response shape (context for the separate list binding). */
export type ProductListResponse = z.infer<typeof productListSchema>;

/** Values collected by the create form (price in DOLLARS, pre-conversion). */
export type CreateProductInput = z.infer<typeof createProductInput>;
