import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Integration test: render the bound screen with a real QueryClient + the real
// useProductsQuery -> fetchProducts -> Zod chain, mocking only the network boundary
// (the shared axios instance from MODULE_REGISTRY: lib/axios.ts). ProductCard and
// formatPrice are used REAL, matching how the grid actually composes them.
vi.mock("@/lib/axios", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
import { api } from "@/lib/axios";
import { ProductsGrid } from "./products-grid";

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
  price: 2400, // cents -> formatPrice renders "$24.00"
  currency: "USD",
  category: "drinkware",
  inStock: true,
};

function listEnvelope(items: unknown[], total = items.length) {
  return { success: true, data: { items, total, page: 1, limit: 20 }, message: "ok" };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductsGrid", () => {
  it("shows the loading state first, then renders the products once loaded", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listEnvelope([product]) });

    render(<ProductsGrid />, { wrapper: createWrapper() });

    // Loading: product data is not on screen yet, and neither error nor empty state shows.
    expect(screen.queryByText("Aero Mug")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Then the data renders, with the price formatted from cents and the stock badge.
    expect(await screen.findByText("Aero Mug")).toBeInTheDocument();
    expect(screen.getByText("$24.00")).toBeInTheDocument();
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });

  it("renders the sold-out badge for out-of-stock products", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: listEnvelope([{ ...product, inStock: false }]),
    });

    render(<ProductsGrid />, { wrapper: createWrapper() });

    expect(await screen.findByText(/sold out/i)).toBeInTheDocument();
  });

  it("shows the empty state when there are no products", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listEnvelope([], 0) });

    render(<ProductsGrid />, { wrapper: createWrapper() });

    expect(await screen.findByText(/no products yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Aero Mug")).not.toBeInTheDocument();
  });

  it("shows the error state when the request fails", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("network down"));

    render(<ProductsGrid />, { wrapper: createWrapper() });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("surfaces an error (never silently renders) when the response contract drifts", async () => {
    // Malformed payload: items[0].id is a number and fields are missing -> Zod throws in fetchProducts.
    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: { items: [{ id: 1 }] } },
    });

    render(<ProductsGrid />, { wrapper: createWrapper() });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/no products yet/i)).not.toBeInTheDocument();
  });
});
