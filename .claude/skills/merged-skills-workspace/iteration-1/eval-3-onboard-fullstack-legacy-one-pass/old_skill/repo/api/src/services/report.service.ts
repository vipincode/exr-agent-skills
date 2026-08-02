import { Product } from "../models/Product";

// DUPLICATE: same job as utils/formatDate.ts
function toDayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function dailyStockReport() {
  const products = await Product.find().lean();
  return { day: toDayString(new Date()), count: products.length };
}
