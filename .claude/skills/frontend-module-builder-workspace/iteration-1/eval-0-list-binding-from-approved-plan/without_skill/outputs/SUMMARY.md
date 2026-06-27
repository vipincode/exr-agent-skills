# Summary — products list binding

Bound the already-built products grid design to the real backend list endpoint
(`GET /api/products`), replacing the hardcoded `SAMPLE` array with live,
Zod-validated data fetched through TanStack Query. Scope is the **list binding only**,
exactly as approved in `frontend/_docs/FEATURE_PLAN_products.md` (detail/create,
pagination UI, and search/filter UI are out of scope).

## Ground truth used
Confirmed the contract against the monorepo backend source before writing any binding:
- `backend/src/modules/products/products.service.ts` — `ProductDTO` shape and the
  `{ items, total, page, limit }` list data; `price` is an **integer in cents** with a
  separate ISO-4217 `currency`.
- `backend/src/lib/app-response.ts` — success envelope `{ success: true, data, message }`
  returned by `ok()`.

The binding mirrors this exactly (no guessed fields; `createdAt/updatedAt` omitted because
the DTO omits them).

## Files created (relative to `frontend/`)
| Path | Purpose |
|---|---|
| `src/features/products/schema/products.schema.ts` | Zod schemas: `productSchema`, `productListDataSchema`, `productsEnvelopeSchema`, `productFiltersSchema`. Mirrors the DTO + success envelope so field/envelope drift fails loudly. |
| `src/features/products/types/products.ts` | `Product`, `ProductListResponse`, `ProductFilters` via `z.infer` of the schemas — no parallel interfaces (per ARCHITECTURE.md). |
| `src/features/products/lib/format-price.ts` | `formatPrice(cents, currency)` -> display string (e.g. `2400`/`"USD"` -> `"$24.00"`) via `Intl.NumberFormat` (cents/100). |
| `src/features/products/api/products.api.ts` | `fetchProducts(filters)` -> `api.get("/products", { params })`, unwraps the envelope and Zod-parses before returning `data`. |
| `src/features/products/hooks/use-products.ts` | `useProductsQuery(filters)` TanStack Query hook; key `["products", filters]`; default `{ page: 1, limit: 20 }`. |
| `src/features/products/index.ts` | Barrel exporting the module's public surface. |

## Files modified (relative to `frontend/`)
| Path | Change |
|---|---|
| `src/features/products/template/products-grid.tsx` | Dropped the hardcoded `SAMPLE` array; now a `"use client"` component consuming `useProductsQuery()`. Maps each `data.items[]` -> `<ProductCard>` (`name`, `formatPrice(price,currency)`, `imageUrl`, `inStock`). Added inline **loading** (skeleton cards), **empty** (no-products copy), and **error** (`role="alert"`) states. |
| `MODULE_REGISTRY.md` | Updated the products feature row (now api/hooks/types/schema/lib + index, bound to the API) and added a products module-surface table so the new exports are discoverable and not duplicated later. |

## Existing code reused (not recreated)
- `src/lib/axios.ts` — the shared `api` axios instance (`baseURL: "/api"`); the request fn goes through it.
- `src/app/api/[...path]/route.ts` — the catch-all BFF proxy already forwards `/api/products`; **no new BFF route** created. The browser only calls same-origin `/api/products`, never the backend directly.
- `src/features/products/components/product-card.tsx` — left **unchanged**; fed mapped props (it already expects a pre-formatted `price: string`).
- TanStack Query (`@tanstack/react-query`) / `useQuery` and the project's `queryClient` (provided in `app/providers.tsx`) for server state.
- Zod for response validation; types derived via `z.infer`.

## Data mapping
`price` (integer cents) + `currency` -> `formatPrice(...)` -> `ProductCard.price` (string).
`name`, `imageUrl?`, `inStock` pass through directly. `slug`, `category`, `total/page/limit`
are fetched/validated but not rendered by the current card (category/pager are design gaps
flagged in the plan).

## Testing checklist coverage (behavior implemented)
- Grid renders live products from `GET /api/products`; `SAMPLE` removed.
- Loading, empty, and error states each render.
- Envelope unwrapped (`data`) and validated by `productsEnvelopeSchema` — drift throws -> surfaced as error.
- Price: integer cents + currency -> formatted string.
- `inStock` drives the In stock / Sold out state per item.
- Query key `["products", filters]`, default page 1 / limit 20.
- Browser calls only same-origin `/api/products` via the BFF proxy.

## Notes / assumptions
- Per-feature path imports use `@/lib/axios` (standard Next.js `@/*` -> `src/*` alias) and
  relative imports within the feature, matching how the existing design files import.
- The fixture has no `node_modules`; no install/build/typecheck was run, but the code is
  written to compile against the documented stack (Zod 4, TanStack Query v5, axios).
- No pager/search UI wired (no design exists); `useProductsQuery` already accepts `filters`
  so it's a drop-in once those controls are built.
