# Test patterns (frontend)

Patterns per layer. Examples use **Vitest + React Testing Library**; translate to Jest if that's what's installed (`vi` → `jest`, same structure). Match the project's import-alias and file-naming convention. Query the DOM the way a user perceives it (`getByRole`, `getByText`, `findBy*` for async) — not by test ids or internal class names — so tests survive refactors.

## Presentational component — render + assert props/state

```tsx
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";

it("shows the name and formatted price", () => {
  render(<ProductCard name="Aero Mug" price="$24.00" inStock imageUrl="/m.png" />);
  expect(screen.getByText("Aero Mug")).toBeInTheDocument();
  expect(screen.getByText("$24.00")).toBeInTheDocument();
});

it("renders the sold-out state when out of stock", () => {
  render(<ProductCard name="Trail Bottle" price="$18.00" inStock={false} />);
  expect(screen.getByText(/sold out/i)).toBeInTheDocument();
});
```

Interactions use `user-event`, not `fireEvent`, for realistic behavior:
```tsx
import userEvent from "@testing-library/user-event";
await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
```

## TanStack Query hook — provider wrapper + mocked network

Wrap the hook in a fresh `QueryClient` with retries off (so a failing request fails the test fast, not after retries). Mock at the network boundary with MSW if present, else mock the `api` instance.

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProductsQuery } from "./use-products";

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// Option A — mock the shared axios instance (the real one named in the registry)
vi.mock("@/lib/axios", () => ({ api: { get: vi.fn() } }));
import { api } from "@/lib/axios";

it("returns unwrapped, validated products", async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: { success: true, data: { items: [{ id: "1", name: "Aero Mug", slug: "aero", price: 2400, currency: "USD", category: "drinkware", inStock: true }], total: 1, page: 1, limit: 20 }, message: "ok" },
  });
  const { result } = renderHook(() => useProductsQuery(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.items[0].name).toBe("Aero Mug");
});

it("surfaces an error when the envelope drifts", async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: { items: [{ id: 1 }] } } }); // bad shape → Zod throws
  const { result } = renderHook(() => useProductsQuery(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isError).toBe(true));
});
```

With **MSW** (preferred when installed), set up a `server` with handlers for `/api/products` and override per-test with `server.use(...)` to force the error path — this exercises the real axios + unwrap + Zod chain.

## Bound screen (integration) — provider + network, assert the three states

```tsx
it("renders products once loaded", async () => {
  // arrange mocked network to return one product
  render(<ProductsGrid />, { wrapper: wrapper() });
  expect(screen.getByTestId("skeleton") ?? screen.getByText(/loading/i)).toBeTruthy(); // loading first
  expect(await screen.findByText("Aero Mug")).toBeInTheDocument();                      // then data
});

it("shows the empty state for no products", async () => {
  // mock network → { items: [], total: 0, ... }
  render(<ProductsGrid />, { wrapper: wrapper() });
  expect(await screen.findByText(/no products/i)).toBeInTheDocument();
});

it("shows the error state on failure", async () => {
  // mock network → 500 / rejected
  render(<ProductsGrid />, { wrapper: wrapper() });
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
```

## Form — validation, submit body, auth gating

```tsx
it("blocks submit and shows a message on invalid input", async () => {
  render(<ProductForm />, { wrapper: wrapper() });
  await userEvent.click(screen.getByRole("button", { name: /create/i }));
  expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
});

it("submits the validated body", async () => {
  // mock the mutation / api.post
  render(<ProductForm />, { wrapper: wrapper() });
  await userEvent.type(screen.getByLabelText(/name/i), "Aero Mug");
  await userEvent.type(screen.getByLabelText(/price/i), "2400");
  await userEvent.click(screen.getByRole("button", { name: /create/i }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/products", expect.objectContaining({ name: "Aero Mug", price: 2400 })));
});
```

For auth gating, mock `@/hooks/use-auth` to return a non-admin and assert the admin-only control is absent; return an admin and assert it's present.

## Zod schema — parse passes/fails

```ts
import { productSchema } from "./products.schema";
it("accepts a valid product", () => expect(() => productSchema.parse(valid)).not.toThrow());
it("rejects a non-integer price", () => expect(() => productSchema.parse({ ...valid, price: 24.5 })).toThrow());
```

## What to assert (envelope- & state-aware)
- The component renders the data/props it's given and the correct **loading / empty / error** branch.
- Hooks return the **unwrapped, Zod-validated** `data` (not the raw envelope), and go to `isError` on a failing or drifted response.
- Browser-bound requests go through the `api` instance (same-origin `/api`) — never an absolute backend URL.
- Forms reject invalid input with the schema's message and submit the validated body; admin-only UI respects `useAuth`.
- No silent rendering of malformed data — envelope/Zod drift must surface as an error.

## Setup notes
- `@testing-library/jest-dom` matchers (`toBeInTheDocument`) need a setup file referenced from the Vitest/Jest config; flag it if missing.
- `cleanup()` between tests (Vitest + RTL auto-cleans with the globals config; note if not).
- MSW and `@testing-library/user-event` are devDependencies — note if they need installing.
