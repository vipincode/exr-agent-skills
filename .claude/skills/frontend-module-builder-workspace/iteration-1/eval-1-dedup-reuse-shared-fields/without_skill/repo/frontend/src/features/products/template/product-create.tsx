"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { ProductForm } from "../components/product-form";
import { useCreateProductMutation } from "../hooks/use-products";
import type { CreateProductInput } from "../schema/products.schema";

/**
 * Admin "create product" screen.
 * - Gates render on `user.role === "admin"` (UI gate; backend `requireRole("admin")`
 *   is the real enforcement). NOTE: `useAuth` is a stub today, so this is hidden
 *   until a real session is wired (see FEATURE_PLAN Dependencies).
 * - Owns the success side effects (toast + redirect). Field-level error mapping
 *   for failed submits lives inside ProductForm (it rejects → form maps).
 */
export function ProductCreate() {
  const router = useRouter();
  const { user } = useAuth();
  const mutation = useCreateProductMutation();

  if (user?.role !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        You do not have permission to create products.
      </p>
    );
  }

  async function handleSubmit(values: CreateProductInput) {
    // Rejects on error → ProductForm maps it onto the fields; toast/redirect skipped.
    const product = await mutation.mutateAsync(values);
    toast.success(`Product "${product.name}" created`);
    router.push("/admin/products");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm onSubmit={handleSubmit} isSubmitting={mutation.isPending} />
    </div>
  );
}
