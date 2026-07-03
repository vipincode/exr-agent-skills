"use client";
import { useProducts } from "../hooks/use-products";
import { ProductCard } from "./product-card";
import { Heading } from "@/components/shared/typography/heading";
export function ProductList() {
  const { data, isLoading } = useProducts();
  if (isLoading) return <p>Loading…</p>;
  return (<div><Heading>Products</Heading>{data?.map((p) => <ProductCard key={p.id} product={p} />)}</div>);
}
