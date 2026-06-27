# Code Review — products feature

**Scope:** `frontend/src/features/products/**` (the products feature changes), reviewed against `frontend/ARCHITECTURE.md` + `frontend/MODULE_REGISTRY.md`.
**Mode:** READ-ONLY. No source files were modified.

---

## Verdict

**Not ready to merge.** The form introduces a real API binding that bypasses the entire toolkit standard (raw `fetch`, no axios `api`, no TanStack Query, no Zod) and ships two duplicated form fields plus a cross-feature import that the architecture explicitly forbids. The design files themselves are fine; the binding work is where the problems are. One High, four Medium, two Low.

Per the registry, `products` is *DESIGN ONLY — no api/hooks/types/schema yet*. `product-form.tsx` has started binding to the backend without first creating the `api/ schema/ hooks/` layer the convention requires, which is the root cause of most findings below.

---

## Findings

### High

**H1 — `features/products/template/product-form.tsx:19-21` — submit bypasses the BFF/axios/Query standard**
`onSubmit` calls `fetch("/api/products", { method: "POST", body: JSON.stringify(values) })`. This violates the core data-binding contract on several axes at once:
- Not the shared `api` axios instance (`src/lib/axios.ts`, `baseURL:"/api"`) — every client request must go through it.
- Server state / mutations must live in **TanStack Query** (`useMutation`), not a fire-and-forget `fetch` in a submit handler.
- The promise is **not awaited** and has **no error handling** — a failed POST fails silently, the user gets no feedback, and nothing invalidates the products list cache.
- Missing `Content-Type: application/json` header, so the backend may reject/ misparse the body.
- The submit `<button>` is never disabled while in flight → double-submit.

Fix: create the missing `features/products/api` + `hooks` layer and use it, e.g.
```ts
// features/products/api/products.api.ts
import { api } from "@/lib/axios";
export const createProduct = (data: CreateProductInput) =>
  api.post("/products", data).then((r) => productSchema.parse(r.data.data));

// features/products/hooks/use-create-product.ts
const qc = useQueryClient();
export const useCreateProduct = () =>
  useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
```
Then in the form: `const { mutate, isPending } = useCreateProduct();` and `disabled={isPending}` on the button, surfacing `isError`.

### Medium

**M1 — `features/products/components/text-field.tsx:1-16` — duplicates the shared `InputField`; raw `useController` + bare `<input>`**
The architecture states *"Every field is a shared `*Field` from `components/shared/form`… no bare useController."* `InputField` already exists (`MODULE_REGISTRY.md` → `components/shared/form/input-field.tsx`). This file re-implements that exact thing (label + input + error text) with `useController` and a hand-rolled `<input>`, and places it *inside* the feature — a generic field reinvented in the wrong home. Fix: delete `text-field.tsx`, import `InputField` from `@/components/shared/form`, and use it in the form.

**M2 — `features/products/template/product-form.tsx:6-15` (`PriceInput`) — another hand-rolled field instead of a shared `*Field`**
Same violation as M1: `useController` + bare `<input type="number">` with hand-rolled label, no error display. Use the shared `InputField` (with numeric handling) rather than a bespoke component. Also note the value-type bug in L2 below.

**M3 — `features/products/template/product-form.tsx:4` — cross-feature import (`features/products` → `features/cart`)**
`import { formatMoney } from "../../cart/lib/format"` directly imports another feature's internals. The architecture is explicit: *"A feature never cross-imports another feature… Generic pieces → `components/shared`."* `formatMoney` is a generic money formatter with no cart-specific logic. Fix: promote it to a shared location (e.g. `src/lib/format.ts` or `components/shared/...`), update the cart feature to import from there, then have products import the shared util. Never reach into `features/cart`.

**M4 — `features/products/template/product-form.tsx:18` — `useForm` with no `zodResolver` / no schema**
The form has no validation and no Zod schema; the contract mandates *"Schemas are Zod"* and types from `z.infer`. With the `products` module having no `schema/` yet, this also means the POST body is unvalidated client-side and untyped. Fix: add `features/products/schema/product.schema.ts`, wire `useForm({ resolver: zodResolver(createProductSchema) })`, and derive types via `z.infer` (no parallel interfaces).

### Low

**L1 — `features/products/components/product-card.tsx:6` — raw `<img>` instead of `next/image`**
Loses Next.js image optimization/lazy-loading. `alt={name}` is correctly present and stock status has a text label (not color-only), so a11y is fine. Minor; switch to `next/image` when convenient. (Acceptable to leave as-is for a design-only card, but worth noting before this becomes data-driven.)

**L2 — `features/products/template/product-form.tsx:11-13` — numeric input yields a string value**
`defaultValues.price` is `0` (number) but `<input type="number" {...field}>` writes a string back through RHF, so the value sent to the backend (and passed to `formatMoney`, typed `(cents: number)`) is a string. Use `valueAsNumber` / coerce, or a Zod `z.coerce.number()` in the schema (M4) so `price` stays a number.

---

## Context note (not a blocker)

`features/products/template/products-grid.tsx` still renders hardcoded `SAMPLE` data and is **not** bound to the API. That is consistent with the registry's "DESIGN ONLY" status, so it isn't flagged as a defect — but it does mean the feature is half-bound (form writes, grid doesn't read), and after a create the grid won't reflect new products. If this PR is meant to "bind the products feature," the grid should move to a `useProductsQuery` that the mutation invalidates (ties into H1).

## What's good

- `product-card.tsx` and `products-grid.tsx` are clean, correctly placed design components with a stable list `key` and proper `alt` text — leave them as-is.
- The intent to reuse an existing money formatter (rather than re-write it) is the right instinct; it just needs to be reused via a *shared* location, not a cross-feature import.
- The catch-all BFF proxy means no new per-feature route is needed — the binding just has to go through `api` to `/api/products`, which keeps the eventual fix small.
