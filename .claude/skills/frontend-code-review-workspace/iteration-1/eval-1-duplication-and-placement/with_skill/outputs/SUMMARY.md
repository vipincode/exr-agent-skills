# Review Summary — products feature

**Mode:** READ-ONLY review. No source files were modified. Full report in `review.md`.

**Verdict:** Not ready to merge. 1 High, 4 Medium, 2 Low.

## Key findings
- **High — H1** `product-form.tsx:19` — submit uses raw `fetch("/api/products")`, bypassing the shared `api` axios instance, TanStack Query (`useMutation`), envelope/Zod parsing, and error/loading handling. Promise not awaited, no `Content-Type`, button not disabled (double-submit). Feature needs its missing `api/ hooks/ schema/` layer.
- **Medium — M1** `text-field.tsx` — duplicates the existing shared `InputField` (registry: `components/shared/form/input-field.tsx`) using a forbidden raw `useController`; wrong home. Delete and import the shared field.
- **Medium — M2** `product-form.tsx:6` (`PriceInput`) — another hand-rolled field instead of a shared `*Field`.
- **Medium — M3** `product-form.tsx:4` — cross-feature import `features/products` -> `features/cart` (`formatMoney`), which the architecture forbids. Promote the formatter to `lib`/`components/shared`.
- **Medium — M4** `product-form.tsx:18` — `useForm` without `zodResolver`/Zod schema; no client-side validation, untyped body.
- **Low — L1** `product-card.tsx:6` — raw `<img>` instead of `next/image`.
- **Low — L2** `product-form.tsx:11` — numeric input produces a string `price`; coerce to number.

## What's good
- `product-card.tsx` / `products-grid.tsx` design components are clean, well-placed, stable `key`, proper `alt`.
- Reuse instinct for the money formatter is right — just route it through a shared location.
- BFF catch-all means the binding fix is small (go through `api` -> `/api/products`).
