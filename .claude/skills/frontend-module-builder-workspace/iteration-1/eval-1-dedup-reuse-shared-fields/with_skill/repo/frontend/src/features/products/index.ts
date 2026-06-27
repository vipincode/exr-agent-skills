// Public surface of the products feature module.
export { ProductCreate } from "./template/product-create";
export { ProductForm } from "./components/product-form";
export { ProductCard } from "./components/product-card";
export { ProductsGrid } from "./template/products-grid";
export { useCreateProductMutation } from "./hooks/use-products";
export { createProduct } from "./api/products.api";
export {
  productSchema,
  createProductInput,
  createProductEnvelopeSchema,
} from "./schema/products.schema";
export type {
  Product,
  ProductListResponse,
  CreateProductInput,
} from "./types/products";
