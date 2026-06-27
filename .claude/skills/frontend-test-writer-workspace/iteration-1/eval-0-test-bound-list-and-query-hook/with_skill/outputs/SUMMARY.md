# Test Summary — products grid + useProductsQuery

## What was tested

### 1. `useProductsQuery` hook — `frontend/src/features/products/hooks/use-products.test.tsx`
TanStack Query hook unit tests (rendered with a real `QueryClientProvider`, retries off):
- Returns the **unwrapped, Zod-validated** list data (`{ items, total, page, limit }`) — not the raw `{ success, data }` envelope.
- **Forwards filters** to the request as query params: `api.get("/products", { params: filters })`.
- Goes to **`isError`** (and leaves `data` undefined) when the request rejects.
- Goes to **`isError`** when the response **envelope/Zod contract drifts** (malformed payload throws in `fetchProducts`) — no silent success.

### 2. `ProductsGrid` bound screen — `frontend/src/features/products/template/products-grid.test.tsx`
Integration tests (real `QueryClientProvider` + real `useProductsQuery → fetchProducts → Zod` chain, only the network mocked):
- **Loading → data**: product not on screen initially, then renders the product with price formatted from cents (`$24.00`) and the stock badge.
- Renders the **sold-out** badge for out-of-stock products.
- **Empty state** (`No products yet.`) when `items: []`.
- **Error state** (`role="alert"`) when the request fails.
- **Contract drift surfaces as an error** (`role="alert"`), never silently rendering the empty/data state.

## Framework / renderer / mocking approach
- **Framework**: Vitest (`vitest run`), detected from `package.json` (`"test": "vitest run"`).
- **Renderer**: React Testing Library (`@testing-library/react`) on **jsdom**, with `@testing-library/jest-dom` matchers.
- **Mocking**: No MSW is installed, so the network is mocked at the **real shared axios instance** (`@/lib/axios`, the `api` named in MODULE_REGISTRY) via `vi.mock` — `vi.mocked(api.get).mockResolvedValue / mockRejectedValue`. This is the network boundary; everything above it runs for real.
- **Query style**: by role/text the way a user perceives it (`findByText`, `findByRole("alert")`, `getByText`), not by class names or test ids.

## What was mocked vs real
- **Mocked**: `@/lib/axios` `api` instance (`.get` / `.post`) — the only network boundary.
- **Real**: `useProductsQuery`, `fetchProducts`, all Zod schemas (`productsEnvelopeSchema` unwrap/validate), the `QueryClient`, `ProductCard`, and `formatPrice`. The grid tests exercise the actual binding chain end-to-end against a controlled network response.

## Test infrastructure added (not app source, no source files modified)
The repo had **no Vitest config, no setup file, and no `tsconfig.json`**, but source uses the `@/` import alias and jest-dom matchers. For the tests to run/pass I added test-only infra:
- `frontend/vitest.config.ts` — `jsdom` env, `globals: true`, `@vitejs/plugin-react`, the `@ → ./src` alias (mirrors the app), and `setupFiles`.
- `frontend/vitest.setup.ts` — registers `@testing-library/jest-dom/vitest` matchers and `cleanup()` between tests.

No source file and no `MODULE_REGISTRY.md` were modified.

## How to run
From `frontend/`:
```
npm install   # env had no node_modules; install first — not run here per instructions
npm test      # vitest run
# or watch:
npm run test:watch
```
All required devDependencies (`vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@vitejs/plugin-react`) are already in `package.json`.

## Note
Per instructions, `node_modules` was not installed and the tests were **not executed** here, so I cannot assert a green run — the tests are written against the real source behavior and envelope shape and are expected to pass once dependencies are installed.
