import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api/products.api";

/**
 * Create-product mutation. On success, invalidates the `["products"]` namespace
 * so the existing (paginated/filtered) products grid refetches and shows the new
 * item. Invalidate-on-success — no optimistic update (no clean optimistic target
 * for a paged list). Exposes `isPending` for the submit button and `error` for
 * inline/field messaging in the template.
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
