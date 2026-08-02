// DESIGN ONLY — composed screen with HARDCODED sample data. Needs to be bound to the products API.
import { ProductCard } from "../components/product-card";
const SAMPLE = [
  { name: "Aero Mug", price: "$24.00", inStock: true },
  { name: "Trail Bottle", price: "$18.00", inStock: false },
];
export function ProductsGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {SAMPLE.map((p) => <ProductCard key={p.name} {...p} />)}
    </div>
  );
}
