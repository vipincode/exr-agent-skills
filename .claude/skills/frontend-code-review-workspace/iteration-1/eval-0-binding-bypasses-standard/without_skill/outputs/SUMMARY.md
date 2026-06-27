# Review Summary — products list binding

**Verdict: Request changes (do not merge).** The binding bypasses the entire BFF -> axios -> TanStack Query -> Zod standard and has a real runtime bug.

## Key findings
1. BLOCKER: `process.env.BACKEND_URL` is `undefined` in the browser (`products-grid.tsx:11`). It is a `"use client"` component; only `NEXT_PUBLIC_*` env vars reach the client. The fetch goes to `undefined/products...` and fails silently — the grid renders empty.
2. BLOCKER: Bypasses the data-binding standard (`products-grid.tsx`): calls the backend directly instead of the same-origin BFF, uses raw `fetch` instead of shared axios (`lib/axios.ts`), uses `useEffect`/`useState` instead of TanStack Query, and skips Zod validation. The feature is missing its `types/ schema/ api/ hooks/` layers (registry says products was DESIGN ONLY, not yet bound).
3. MAJOR: No loading/error/empty states; unhandled promise rejection — no `.catch`, no feedback on failure.
4. MAJOR: Untyped `any` data (`useState<any[]>`, `(p: any)`) across a network boundary; architecture requires `z.infer` types.
5. MINOR: Currency hardcoded to `$` (`products-grid.tsx:22`), ignoring the backend `currency` field; use `Intl.NumberFormat`.
6. MINOR: No request cancellation / race protection in the bare `useEffect` fetch.

## Fix
Add `schema/`, `types/`, `api/`, `hooks/` to `features/products/`; rebind the template to a `useProductsQuery` hook that calls `api.get("/products", { params })`, unwraps the `{ success, data, message }` envelope, and validates with Zod; render loading/error/empty states; format price with the returned currency; update `MODULE_REGISTRY.md`. Concrete code in `review.md`.

## Non-issues
- `product-card.tsx` is a clean presentational component (only the price string passed to it needs the currency fix at the call site).
- The `data.items` path matches the real backend envelope, but it must still be validated rather than read as `any`.
