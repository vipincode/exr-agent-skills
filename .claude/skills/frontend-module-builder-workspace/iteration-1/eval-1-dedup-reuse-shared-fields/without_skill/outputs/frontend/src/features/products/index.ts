// Public surface of the products feature.
export { ProductCard } from "./components/product-card";
export { ProductForm } from "./components/product-form";
export { ProductsGrid } from "./template/products-grid";
export { ProductCreate } from "./template/product-create";

export { useCreateProductMutation } from "./hooks/use-products";
export { createProduct } from "./api/products.api";

export {
  createProductInput,
  productSchema,
  type CreateProductInput,
} from "./schema/products.schema";
export type { Product, ProductListResponse } from "./types/products";
