import { Product } from "../models/Product";
import { notFound } from "../utils/ApiError";

export async function listProducts(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find().skip(skip).limit(limit).lean(),
    Product.countDocuments(),
  ]);
  return { items, total, page, limit };
}

export async function getProduct(id: string) {
  const doc = await Product.findById(id).lean();
  if (!doc) throw notFound("Product");
  return doc;
}
