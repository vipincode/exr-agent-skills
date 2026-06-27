"use client";
// Bound to GET /api/products via useProductsQuery. The hardcoded SAMPLE array is gone —
// the grid now renders live, Zod-validated data and handles loading / empty / error states.
import { ProductCard } from "../components/product-card";
import { useProductsQuery } from "../hooks/use-products";
import { formatPrice } from "../lib/format-price";

const GRID = "grid grid-cols-2 gap-4 md:grid-cols-4";

export function ProductsGrid() {
  const { data, isPending, isError } = useProductsQuery();

  if (isPending) {
    return (
      <div className={GRID}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-xl border bg-muted"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-red-500">
        Something went wrong loading products. Please try again.
      </p>
    );
  }

  if (data.items.length === 0) {
    return <p className="text-muted-foreground">No products found.</p>;
  }

  return (
    <div className={GRID}>
      {data.items.map((p) => (
        <ProductCard
          key={p.id}
          name={p.name}
          price={formatPrice(p.price, p.currency)}
          imageUrl={p.imageUrl}
          inStock={p.inStock}
        />
      ))}
    </div>
  );
}
