"use client";
// Composed products screen — now bound to the live products API (GET /api/products) via TanStack Query.
// The hardcoded SAMPLE array has been removed; ProductCard is reused unchanged, fed mapped props.
import { ProductCard } from "../components/product-card";
import { useProductsQuery } from "../hooks/use-products";
import { formatPrice } from "../lib/format-price";

export function ProductsGrid() {
  const { data, isPending, isError } = useProductsQuery();

  // Loading — lightweight skeleton grid (design has no skeleton; stubbed per plan's Design gaps).
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }

  // Error — network/5xx, envelope success:false, or Zod drift all land here.
  if (isError) {
    return (
      <p role="alert" className="text-red-500">
        Couldn’t load products. Please try again.
      </p>
    );
  }

  // Empty — distinct from a blank grid.
  if (data.items.length === 0) {
    return <p className="text-muted-foreground">No products yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
