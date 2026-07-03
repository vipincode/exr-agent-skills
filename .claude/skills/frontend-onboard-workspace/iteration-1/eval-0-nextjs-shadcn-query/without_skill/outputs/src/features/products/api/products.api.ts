import { api } from "@/lib/axios";
import type { Product } from "../types";
export async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get<{ data: Product[] }>("/products");
  return data.data;
}
