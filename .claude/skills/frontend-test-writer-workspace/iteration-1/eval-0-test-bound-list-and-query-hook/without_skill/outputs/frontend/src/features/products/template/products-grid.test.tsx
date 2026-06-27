import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProductsGrid } from "./products-grid";
import { useProductsQuery } from "../hooks/use-products";
import type { Product } from "../types/products";

// The grid is a pure presentation layer over useProductsQuery: it renders
// loading skeletons / an error alert / an empty message / a card grid based on
// the query state. We mock the hook so each render state is exercised in
// isolation, without TanStack Query or the network.
vi.mock("../hooks/use-products", () => ({
  useProductsQuery: vi.fn(),
}));

const mockedUseProductsQuery = vi.mocked(useProductsQuery);

// Helper: shape a useQuery-like result. Cast through unknown because we only
// ever read the three fields the component touches (data/isPending/isError).
function queryState(state: {
  data?: { items: Product[]; total: number; page: number; limit: number };
  isPending?: boolean;
  isError?: boolean;
}) {
  return {
    data: state.data,
    isPending: state.isPending ?? false,
    isError: state.isError ?? false,
  } as unknown as ReturnType<typeof useProductsQuery>;
}

const sampleProducts: Product[] = [
  {
    id: "p1",
    name: "Aero Mug",
    slug: "aero-mug",
    price: 1999, // cents -> $19.99
    currency: "USD",
    category: "kitchen",
    inStock: true,
    imageUrl: "https://cdn.example.com/aero-mug.png",
  },
  {
    id: "p2",
    name: "Nimbus Notebook",
    slug: "nimbus-notebook",
    price: 850, // cents -> $8.50
    currency: "USD",
    category: "office",
    inStock: false,
    // no imageUrl on purpose -> card should not render an <img>
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductsGrid", () => {
  it("renders 8 loading skeletons while the query is pending", () => {
    mockedUseProductsQuery.mockReturnValue(
      queryState({ isPending: true, data: undefined }),
    );

    const { container } = render(<ProductsGrid />);

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(8);
    // No cards / alert while loading.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders an accessible error alert when the query fails", () => {
    mockedUseProductsQuery.mockReturnValue(queryState({ isError: true }));

    render(<ProductsGrid />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/couldn.?t load products/i);
  });

  it("renders an empty-state message when there are no products", () => {
    mockedUseProductsQuery.mockReturnValue(
      queryState({ data: { items: [], total: 0, page: 1, limit: 20 } }),
    );

    render(<ProductsGrid />);

    expect(screen.getByText(/no products yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a card per product with formatted price, stock state and image", () => {
    mockedUseProductsQuery.mockReturnValue(
      queryState({
        data: { items: sampleProducts, total: 2, page: 1, limit: 20 },
      }),
    );

    render(<ProductsGrid />);

    // Names
    expect(screen.getByText("Aero Mug")).toBeInTheDocument();
    expect(screen.getByText("Nimbus Notebook")).toBeInTheDocument();

    // Prices are run through formatPrice (cents -> currency string)
    expect(screen.getByText("$19.99")).toBeInTheDocument();
    expect(screen.getByText("$8.50")).toBeInTheDocument();

    // Stock state mapped to copy
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("Sold out")).toBeInTheDocument();

    // imageUrl present -> <img> with the product name as alt text
    const img = screen.getByRole("img", { name: "Aero Mug" });
    expect(img).toHaveAttribute(
      "src",
      "https://cdn.example.com/aero-mug.png",
    );
    // Product without imageUrl renders no image
    expect(screen.queryByRole("img", { name: "Nimbus Notebook" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("calls useProductsQuery (drives its data from the hook)", () => {
    mockedUseProductsQuery.mockReturnValue(
      queryState({ data: { items: [], total: 0, page: 1, limit: 20 } }),
    );

    render(<ProductsGrid />);

    expect(mockedUseProductsQuery).toHaveBeenCalledTimes(1);
  });
});
