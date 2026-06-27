import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock the REAL shared axios instance (MODULE_REGISTRY: lib/axios.ts, baseURL "/api").
// This lets the hook exercise the real api fn + Zod unwrap chain against a controlled network.
vi.mock("@/lib/axios", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
import { api } from "@/lib/axios";
import { useProductsQuery } from "./use-products";

// Fresh QueryClient per render, retries OFF so a failing request fails the test fast.
function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

const product = {
  id: "1",
  name: "Aero Mug",
  slug: "aero-mug",
  price: 2400, // integer cents
  currency: "USD",
  category: "drinkware",
  inStock: true,
};

// Real backend success envelope shape (ARCHITECTURE: success/data/message).
const listEnvelope = {
  success: true,
  data: { items: [product], total: 1, page: 1, limit: 20 },
  message: "ok",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useProductsQuery", () => {
  it("returns the unwrapped, Zod-validated list data (not the raw envelope)", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listEnvelope });

    const { result } = renderHook(() => useProductsQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Unwrapped: data is the inner `data`, with items/total — NOT the { success, data } envelope.
    expect(result.current.data).toEqual({
      items: [product],
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(result.current.data?.items[0].name).toBe("Aero Mug");
    expect(result.current.data).not.toHaveProperty("success");
  });

  it("forwards filters to the /api/products request as query params", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listEnvelope });
    const filters = { page: 2, limit: 20, category: "drinkware", search: "mug" };

    const { result } = renderHook(() => useProductsQuery(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/products", { params: filters });
  });

  it("surfaces an error when the request fails", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useProductsQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("surfaces an error (does not return data) when the envelope/Zod contract drifts", async () => {
    // id should be a string and required fields are missing -> productsEnvelopeSchema.parse throws.
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: { items: [{ id: 1 }] } },
    });

    const { result } = renderHook(() => useProductsQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
