"use client";
import { useEffect, useState } from "react";
import { ProductCard } from "../components/product-card";

// Products list — wired up to show real data.
export function ProductsGrid() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // hit the backend directly so we get the data
    fetch(`${process.env.BACKEND_URL}/products?page=1&limit=20`)
      .then((r) => r.json())
      .then((json) => setProducts(json.data.items));
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((p: any) => (
        <ProductCard
          key={p.id}
          name={p.name}
          price={`$${p.price}`}
          imageUrl={p.imageUrl}
          inStock={p.inStock}
        />
      ))}
    </div>
  );
}
