import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useProductsQuery, useCreateProductMutation } from "./use-products";
import { fetchProducts, createProduct } from "../api/products.api";
import type { ProductListResponse } from "../types/products";

// We test the hooks' *query wiring* (keys, queryFn args, state transitions,
// invalidation) — not the network or Zod parsing, so the api layer is mocked.
vi.mock("../api/products.api", () => ({
  fetchProducts: vi.fn(),
  createProduct: vi.fn(),
}));

const mockedFetchProducts = vi.mocked(fetchProducts);
const mockedCreateProduct = vi.mocked(createProduct);

// Fresh QueryClient per test with retries off so rejected queries surface as
// isError immediately instead of being retried.
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const listResponse: ProductListResponse = {
  items: [
    {
      id: "p1",
      name: "Aero Mug",
      slug: "aero-mug",
      price: 1999,
      currency: "USD",
      category: "kitchen",
      inStock: true,
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useProductsQuery", () => {
  it("returns the unwrapped product list on success", async () => {
    mockedFetchProducts.mockResolvedValue(listResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProductsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(listResponse);
    expect(mockedFetchProducts).toHaveBeenCalledTimes(1);
  });

  it("calls fetchProducts with no filters when none are passed", async () => {
    mockedFetchProducts.mockResolvedValue(listResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProductsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchProducts).toHaveBeenCalledWith(undefined);
  });

  it("forwards filters to fetchProducts (which feed the query key)", async () => {
    mockedFetchProducts.mockResolvedValue(listResponse);
    const { wrapper } = createWrapper();
    const filters = { category: "kitchen", search: "mug", page: 2, limit: 10 };

    const { result } = renderHook(() => useProductsQuery(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchProducts).toHaveBeenCalledWith(filters);
  });

  it("surfaces isError when the query function rejects", async () => {
    mockedFetchProducts.mockRejectedValue(new Error("boom"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProductsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("caches separate filter combinations under distinct query keys", async () => {
    mockedFetchProducts.mockResolvedValue(listResponse);
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ category }: { category: string }) => useProductsQuery({ category }),
      { wrapper, initialProps: { category: "kitchen" } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ category: "office" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A new key => a new fetch for the second category.
    expect(mockedFetchProducts).toHaveBeenCalledWith({ category: "kitchen" });
    expect(mockedFetchProducts).toHaveBeenCalledWith({ category: "office" });
    expect(mockedFetchProducts).toHaveBeenCalledTimes(2);
  });
});

describe("useCreateProductMutation", () => {
  const newProduct = {
    name: "Nimbus Notebook",
    price: 850,
    currency: "USD",
    category: "office",
    inStock: true,
  };

  it("calls createProduct with the submitted body and returns the result", async () => {
    const created = {
      id: "p2",
      slug: "nimbus-notebook",
      ...newProduct,
    };
    mockedCreateProduct.mockResolvedValue(created);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    result.current.mutate(newProduct);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedCreateProduct).toHaveBeenCalledWith(newProduct);
    expect(result.current.data).toEqual(created);
  });

  it("invalidates the products query on success", async () => {
    const created = { id: "p2", slug: "nimbus-notebook", ...newProduct };
    mockedCreateProduct.mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    result.current.mutate(newProduct);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["products"] });
  });

  it("surfaces isError when createProduct rejects", async () => {
    mockedCreateProduct.mockRejectedValue(new Error("nope"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateProductMutation(), { wrapper });

    result.current.mutate(newProduct);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
