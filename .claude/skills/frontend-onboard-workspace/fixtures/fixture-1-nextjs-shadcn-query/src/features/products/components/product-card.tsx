import type { Product } from "../types";
export function ProductCard({ product }: { product: Product }) {
  return <div className="rounded border p-4">{product.name} — ${product.price}</div>;
}
