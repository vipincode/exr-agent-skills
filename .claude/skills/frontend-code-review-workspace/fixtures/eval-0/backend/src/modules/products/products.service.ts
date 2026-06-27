import { Product, type ProductDoc } from "./products.model.js";
export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  category: string;
  inStock: boolean;
  imageUrl?: string;
}
const toDTO = (p: ProductDoc): ProductDTO => ({
  id: p._id.toString(),
  name: p.name, slug: p.slug, price: p.price, currency: p.currency,
  category: p.category, inStock: p.inStock, imageUrl: p.imageUrl,
});
export async function listProducts(q: { page: number; limit: number; search?: string; category?: string }) {
  const filter: Record<string, unknown> = {};
  if (q.search)   filter.name = { $regex: q.search, $options: "i" };
  if (q.category) filter.category = q.category;
  const [docs, total] = await Promise.all([
    Product.find(filter).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { items: docs.map((d) => toDTO(d as ProductDoc)), total, page: q.page, limit: q.limit };
}
export async function getProduct(id: string) {
  const doc = await Product.findById(id).lean();
  return doc ? toDTO(doc as ProductDoc) : null;
}
export async function createProduct(input: Omit<ProductDTO, "id" | "slug">) {
  const slug = input.name.toLowerCase().replace(/\s+/g, "-");
  const doc = await Product.create({ ...input, slug });
  return toDTO(doc);
}
