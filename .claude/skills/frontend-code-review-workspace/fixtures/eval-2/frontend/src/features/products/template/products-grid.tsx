"use client";
import { ProductCard } from "../components/product-card";
import { useProductsQuery } from "../hooks/use-products";
import { formatPrice } from "../format-price";

export function ProductsGrid() {
  const { data, isPending, isError } = useProductsQuery();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    );
  }
  if (isError) return <p role="alert">Couldn’t load products. Please try again.</p>;
  if (!data.items.length) return <p className="text-muted-foreground">No products yet.</p>;

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
