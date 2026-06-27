# RUN NOTES — products API binding plan

## Task
Plan binding the built-but-unbound products grid design (currently a hardcoded `SAMPLE` array) to
the real backend so it shows live data. PLANNING ONLY — no code written.

## Project resolution
Resolved via `.claude/workspace.json`:
- backend → `backend/` (express-ts)
- frontend → `frontend/` (nextjs)
Plan written to the frontend project dir: `frontend/_docs/FEATURE_PLAN_products.md`.

## API source / rung
**Rung 1 — monorepo backend source** (highest fidelity). Read the full chain:
`backend/src/app.ts` (mount), `products.routes.ts`, `products.controller.ts`, `products.service.ts`
(ProductDTO), `products.schema.ts` (request Zod), `products.model.ts` (persisted shape), and
`backend/src/lib/app-response.ts` + `backend/ARCHITECTURE.md` (envelope). No guessing; not blocked.

## Envelope
- **Success:** `{ "success": true, "data": <data>, "message": string }` (200 `ok`, 201 `created`).
- **Error:** `{ "success": false, "message": string, "code": string }` — 401 / 404 / 409 / 422.

## Endpoints
| Method | Path | Auth | Request | `data` |
|--------|------|------|---------|--------|
| GET | /api/products | public | query: page(1), limit(20, max100), search?, category? | `{ items: Product[], total, page, limit }` |
| GET | /api/products/:id | public | params: id (24-hex) | `Product` |
| POST | /api/products | protect + requireRole('admin') | body: name, price(int cents), currency(USD), category, inStock(true), imageUrl? | `Product` (201) |

`Product` = `{ id, name, slug, price (int CENTS), currency, category, inStock, imageUrl? }`.

## Scope decided
List binding only (GET /api/products) — the task is "show real data" in the grid. Detail + create
endpoints exist but are out of scope.

## Key finding — design ↔ data mismatch
`ProductCard` expects `price: string` ("$24.00"); the API returns `price` as integer **cents** plus
a separate `currency`. Binding owns a `formatPrice(cents, currency)` transform (Intl.NumberFormat).

## Reuse (no recreation)
axios `src/lib/axios.ts`, catch-all BFF `src/app/api/[...path]/route.ts` (covers `/api/products`,
no new BFF route), `src/lib/query-client.ts`, the built `ProductCard` + `ProductsGrid`. `useAuth`
only relevant to the (out-of-scope) admin create path.

## Design gaps flagged
Loading / empty / error states, pagination control, and search/filter/category UI are not built
(API supports paged + search + category). Core grid + card are complete and ready to bind.

## Assumptions stated (no clarifying questions asked, per rules)
- Bind first page, default limit 20, no pager UI yet (server is paged-only; design has no pager).
- Search/filter not wired this pass (hook accepts a `filters` arg for drop-in later).
- `ProductsGrid` is mounted by an existing route; no new route created.

## Open questions (carried in the plan)
- Pager strategy beyond page 1 (paged / load-more / infinite).
- `BACKEND_URL` set in frontend env? (proxy impl elided in fixture).
- Single vs mixed currency display (formatter already takes per-item currency).
- Is `ProductsGrid` already mounted by a route, or is `app/products/page.tsx` still needed?

## Status
**draft** (not blocked) — contract fully observed from source. Every template section produced,
including the new Dependencies and Testing checklist sections.
