# Review Summary — products feature

**Verdict: Request changes — do not merge.**

## Key findings
1. **BLOCKER (DRY):** `features/products/components/text-field.tsx` duplicates the registered shared
   `InputField` (`components/shared/form`). Convention mandates shared `*Field` only. Delete and reuse.
2. **BLOCKER (Placement):** That generic field is in a feature folder; generic pieces must live in
   `components/shared`. Resolved by reusing the shared one.
3. **BLOCKER (Convention/DRY):** Inline `PriceInput` in `product-form.tsx` uses bare `useController`
   (explicitly forbidden) and drops error display. Use a shared field.
4. **BLOCKER (Cross-feature import):** `product-form.tsx` imports `formatMoney` from the cart feature
   (`../../cart/lib/format`). Features must not cross-import. Promote to `src/lib/format.ts`.
5. **BLOCKER (Binding bypass):** `product-form.tsx` posts via raw `fetch("/api/products")` — bypasses
   axios (`lib/axios.ts`), TanStack Query mutations, and Zod. Also no Content-Type header, no error/
   pending handling, no query invalidation, and `price` arrives as a string (missing `valueAsNumber`).
   Build the proper `schema/ api/ hooks/` layer.
6. **MAJOR:** `products-grid.tsx` still renders hardcoded `SAMPLE` data — list side is unbound; needs a
   `useProductsQuery`, and the `price` type (display string) won't match numeric API cents.
7. **MINOR (a11y/quality):** labels not linked to inputs; `ProductCard` uses native `<img>` not next/image.

## Theme
The feature is still effectively DESIGN-ONLY (per the registry) but smuggles in an ad-hoc, non-standard
binding. Every change should reuse existing shared code and the axios + Zod + TanStack Query standard.
