"use client";

import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import type { UseFormReturn } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { ProductForm } from "../components/product-form";
import { useCreateProductMutation } from "../hooks/use-products";
import type { CreateProductInput } from "../types/products";

/** Top-level error message — only for errors NOT mapped onto a field. */
function topLevelError(error: unknown): string | null {
  if (!error) return null;
  if (isAxiosError(error)) {
    const status = error.response?.status;
    // 409 -> name field, 422 -> form root, 401 -> redirect; handled in onSubmit.
    if (status === 409 || status === 422 || status === 401) return null;
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      "Couldn’t create the product. Please try again."
    );
  }
  return "Couldn’t create the product. Please try again.";
}

/**
 * Admin "create product" screen. Gates render on the admin role (backend
 * `requireRole("admin")` is the real enforcement), wires the create mutation,
 * maps server errors back onto the form, and redirects to the list on success.
 */
export function ProductCreate() {
  const { user } = useAuth();
  const router = useRouter();
  const mutation = useCreateProductMutation();

  // NOTE: `useAuth` is a stub returning `{ user: null }` today (see plan
  // Dependencies). Until a real session/role is wired, this gate hides the form.
  if (user?.role !== "admin") {
    return (
      <p role="alert" className="p-6 text-sm text-muted-foreground">
        You need admin access to create products.
      </p>
    );
  }

  async function handleSubmit(
    values: CreateProductInput,
    form: UseFormReturn<CreateProductInput>,
  ) {
    try {
      await mutation.mutateAsync(values);
      form.reset();
      // TODO(toast): show a success toast once toast infra exists (none in registry).
      router.push("/admin/products");
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Something went wrong.";

        if (status === 409) {
          form.setError("name", {
            message: "A product with this name already exists.",
          });
          return;
        }
        if (status === 422) {
          // Observed error envelope has no per-field details, so surface the
          // validation message at the form level.
          form.setError("root", { message });
          return;
        }
        if (status === 401) {
          router.push("/login");
          return;
        }
      }
      // Other errors fall through to the top-level error banner (mutation.error).
    }
  }

  return (
    <section className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-xl font-semibold">New product</h1>
      <ProductForm
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        submitError={topLevelError(mutation.error)}
      />
    </section>
  );
}
