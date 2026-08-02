// DESIGN ONLY — built by figma-to-component. Renders a product; not wired to the API yet.
type ProductCardProps = { name: string; price: string; imageUrl?: string; inStock: boolean };
export function ProductCard({ name, price, imageUrl, inStock }: ProductCardProps) {
  return (
    <div className="rounded-xl border p-4">
      {imageUrl ? <img src={imageUrl} alt={name} className="aspect-square rounded-lg object-cover" /> : null}
      <h3 className="mt-2 font-medium">{name}</h3>
      <p className="text-muted-foreground">{price}</p>
      <span className={inStock ? "text-green-600" : "text-red-500"}>{inStock ? "In stock" : "Sold out"}</span>
    </div>
  );
}
