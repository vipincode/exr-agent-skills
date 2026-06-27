import * as z from "zod";
import { productSchema, productListDataSchema, productFiltersSchema } from "../schema/products.schema";

export type Product = z.infer<typeof productSchema>;
export type ProductListResponse = z.infer<typeof productListDataSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
