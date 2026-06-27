import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../api/products.api";

/**
 * Create-product mutation. On success, invalidates the `["products"]` namespace
 * so the existing products grid refetches and shows the new product.
 * Invalidate-on-success (no optimistic update — the grid is paginated/filtered).
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
