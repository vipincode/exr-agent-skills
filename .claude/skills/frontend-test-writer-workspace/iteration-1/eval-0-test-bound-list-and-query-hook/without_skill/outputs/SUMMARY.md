# Test Summary — products grid & useProductsQuery

## What was tested

### 1. `ProductsGrid` (`src/features/products/template/products-grid.test.tsx`)
A presentation component driven entirely by `useProductsQuery`. Tests cover all four
render branches plus its wiring:

- **Loading** — when `isPending`, renders exactly 8 skeleton placeholders (`.animate-pulse`) and no alert.
- **Error** — when `isError`, renders an accessible `role="alert"` with the "Couldn't load products" copy.
- **Empty** — when `data.items` is empty, renders the "No products yet" message (no alert).
- **Populated** — renders one card per product with:
  - product names,
  - prices passed through `formatPrice` (real, not mocked): `1999c -> $19.99`, `850c -> $8.50`,
  - stock copy ("In stock" / "Sold out"),
  - an `<img>` (alt = product name) only when `imageUrl` is present (verified exactly 1 image for 2 products).
- **Wiring** — confirms the component calls `useProductsQuery`.

### 2. `useProductsQuery` & `useCreateProductMutation` (`src/features/products/hooks/use-products.test.tsx`)
TanStack Query hooks. Tests cover query/mutation wiring (keys, queryFn args, state
transitions, cache invalidation) — not the network or Zod parsing:

- Returns the unwrapped product list on success.
- Calls `fetchProducts(undefined)` when no filters are passed.
- Forwards filters to `fetchProducts` (which feed the `["products", filters]` key).
- Surfaces `isError` (with `data === undefined`) when the query function rejects.
- Distinct filter combinations produce distinct query keys -> separate fetches.
- `useCreateProductMutation` calls `createProduct` with the submitted body and returns the result.
- The mutation invalidates `["products"]` on success (spied on `queryClient.invalidateQueries`).
- The mutation surfaces `isError` when `createProduct` rejects.

## Framework & mocking approach

- **Runner:** Vitest (per `package.json`), `jsdom` environment, `globals: true`.
- **Component testing:** `@testing-library/react` + `@testing-library/jest-dom` matchers.
- **Mocking strategy (module-boundary, no network):**
  - The grid test mocks the **hook module** (`../hooks/use-products`) with `vi.mock`, so each
    query state is injected directly. `formatPrice` is exercised for real to verify integration.
  - The hook test mocks the **api module** (`../api/products.api`), so `fetchProducts`/`createProduct`
    are controlled; the real `useQuery`/`useMutation` run inside a per-test `QueryClient`
    (`retry: false`) provided via `QueryClientProvider`. Async state is awaited with `waitFor`.
- No source files were modified.

## Test infrastructure added (not source)

The repo had no Vitest config/setup, no `tsconfig`, and no `@`-alias resolution. Two
infra files were added so the tests run and resolve `@/lib/axios`-style imports:

- `frontend/vitest.config.ts` — jsdom env, `@vitejs/plugin-react`, `@ -> ./src` alias, setup file, `globals`.
- `frontend/vitest.setup.ts` — registers `@testing-library/jest-dom` matchers.

## How to run

From the `frontend/` directory (after `npm install`, which was intentionally skipped here):

```bash
npm test            # vitest run (one-shot)
npm run test:watch  # vitest (watch mode)
```

Run a single file, e.g.:

```bash
npx vitest run src/features/products/hooks/use-products.test.tsx
```

## Files

- `frontend/vitest.config.ts`
- `frontend/vitest.setup.ts`
- `frontend/src/features/products/template/products-grid.test.tsx`
- `frontend/src/features/products/hooks/use-products.test.tsx`
