# Frontend Code Review — products binding

**Scope:** `frontend/src/features/products/` (the API binding layer: types, schema, api, hooks, template, plus the design-only card and a price util).
**Contract:** reviewed against `frontend/ARCHITECTURE.md` + `frontend/MODULE_REGISTRY.md`.
**Mode:** read-only. No source files were modified.

---

## Verdict

**Production-ready — this is a clean, contract-conformant binding.** It goes through the shared axios `api` instance to the same-origin `/api` BFF, unwraps the success envelope and Zod-parses it (failing loudly on drift), keeps server state in TanStack Query with a feature-namespaced array key, and renders loading / error / empty / success states. No Critical, High, or Medium findings. Only two Low maintainability notes below.

---

## Findings

### Low

- **Low — `src/features/products/format-price.ts` — util sits at the feature root, off the documented anatomy.**
  `ARCHITECTURE.md` defines the feature module as `types/ schema/ api/ hooks/ components/ template/ index.ts`; a loose util at the feature root doesn't fit that shape. It is correct to keep it feature-local for now (single consumer, not in the registry, so no DRY violation). If price formatting gets reused elsewhere, promote it to `src/lib/` and register it rather than copying. Low-impact; placement only.

- **Low — `src/features/products/` — no `index.ts` barrel.**
  The anatomy in `ARCHITECTURE.md` lists `index.ts` as part of a feature module; this feature exposes its template via deep imports instead. Adding a barrel that re-exports `ProductsGrid` (and `useProductsQuery`/types as needed) would match the documented convention. Cosmetic.

### Note (not a defect — out of binding scope)

- `src/features/products/components/product-card.tsx` is marked DESIGN ONLY (built by figma-to-component) and uses a raw `<img>`. It has a proper `alt={name}`, and stock status is conveyed by **text** ("In stock" / "Sold out") in addition to color, so the common a11y traps are already avoided. Switching to `next/image` would be a perf nicety but is a design-layer concern, not part of this binding, and the contract does not mandate it.

---

## What's good (keep doing this)

- **Envelope handling is exactly right.** `productsEnvelopeSchema.parse(res.data).data` in `api/products.api.ts` unwraps and validates in one step — no `any`, no raw envelope leaking into components, drift fails loudly.
- **No direct backend access.** Requests go through `@/lib/axios` (`baseURL: "/api"`) to the catch-all BFF; no `fetch` to an absolute URL, no `BACKEND_URL`/secrets in client code.
- **Server state via TanStack Query, done correctly** — array key namespaced by feature (`["products", filters]`), and `placeholderData: keepPreviousData` so paged results don't flash to empty.
- **All UI states handled** in `template/products-grid.tsx`: skeleton on `isPending`, `role="alert"` error message, distinct empty state, then the grid. List keyed by stable `p.id`, not index.
- **Types flow from Zod** (`z.infer`) with no parallel interfaces — the only standalone type is `ProductCardProps`, which is a legitimate presentational prop contract, not a duplicate of the schema.
- **`"use client"`** is on the template (which needs the Query hook) and not pushed onto the leaf card unnecessarily.

No findings were manufactured; the binding is sound as written.
