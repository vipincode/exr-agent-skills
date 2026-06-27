# Code Review — products feature changes

**Scope reviewed:** `frontend/src/features/products/**` plus the shared pieces it touches
(`components/shared/form`, `features/cart/lib/format.ts`, `lib/axios.ts`, BFF route).
**Mode:** Read-only static review against the project's `ARCHITECTURE.md` + `MODULE_REGISTRY.md`.

## Verdict: ⛔ Request changes — do not merge

The products changes violate several of this project's core conventions: a duplicated form
field, a wrong-placement generic component, a cross-feature import, bare `useController`, and an
ad-hoc `fetch()` binding that bypasses the mandated axios + Zod + TanStack Query standard. Most are
quick, mechanical fixes. None of the data binding is production-ready.

---

## Findings

### 1. [BLOCKER · DRY] `text-field.tsx` duplicates the shared `InputField`
**Location:** `frontend/src/features/products/components/text-field.tsx`

The new `TextField` is a labeled, RHF-controlled text input with error display — exactly what the
already-registered shared field provides:

> MODULE_REGISTRY.md → `InputField | components/shared/form/input-field.tsx`
> ARCHITECTURE.md → "Forms — RHF + Zod via shared `*Field` only. Every field is a shared `*Field`
> from `components/shared/form`."

This is a duplicate of existing shared code and should never have been created. The registry says to
check there FIRST before creating any component.

**Fix:** Delete `text-field.tsx`. In `product-form.tsx` use the shared field:
```ts
import { InputField } from "@/components/shared/form";
...
<InputField name="name" label="Name" />
```

### 2. [BLOCKER · Placement] Generic form field placed in a feature folder
**Location:** `frontend/src/features/products/components/text-field.tsx`

Even setting aside the duplication, a generic labeled text input is not product-specific. Per
ARCHITECTURE: "Generic pieces → `components/shared`; domain → `features/<name>/components`." A reusable
form field belongs in `components/shared/form`, not `features/products/components`. (Resolved for free
by fix #1 — reuse the shared one rather than relocating this copy.)

### 3. [BLOCKER · DRY + convention] Inline `PriceInput` re-implements a form field with bare `useController`
**Location:** `frontend/src/features/products/template/product-form.tsx` (lines 6–15)

`PriceInput` hand-rolls a controlled number input with raw `useController`. ARCHITECTURE explicitly
forbids this: "Schemas are Zod; **no bare useController**" and "Every field is a shared `*Field`."
It also silently drops error display (no `fieldState.error`), so validation errors on price would be
invisible.

**Fix:** Use a shared field. If no number field exists yet, add `NumberField` to
`components/shared/form` (and register it) rather than inlining one per feature:
```ts
<InputField name="price" label="Price (cents)" type="number" />
```

### 4. [BLOCKER · Cross-feature import] products imports from the cart feature
**Location:** `frontend/src/features/products/template/product-form.tsx` line 4
```ts
import { formatMoney } from "../../cart/lib/format"; // reuse the cart money formatter
```
ARCHITECTURE: "A feature never cross-imports another feature." `formatMoney` is generic money
formatting, not cart domain logic — it should be promoted to shared (`src/lib/format.ts`) and consumed
by both cart and products.

**Fix:** Move `formatMoney` to `src/lib/format.ts`, add it to MODULE_REGISTRY.md's shared library
table, and update both cart and products to import from `@/lib/format`. Remove the cross-feature import.

### 5. [BLOCKER · API binding bypasses the standard] raw `fetch()` instead of axios + Zod + TanStack Query
**Location:** `frontend/src/features/products/template/product-form.tsx` (lines 18–21)
```ts
const form = useForm({ defaultValues: { name: "", price: 0 } });
const onSubmit = form.handleSubmit((values) => {
  fetch("/api/products", { method: "POST", body: JSON.stringify(values) });
});
```
This violates multiple architectural rules at once:
- **Not axios:** mutations must go through the single axios instance (`lib/axios.ts`, `baseURL: "/api"`),
  not raw `fetch`.
- **Not TanStack Query:** server state/mutations must use `useXMutation` hooks in `features/products/api`
  (or `/hooks`). There is no mutation hook, no `["products"]` query invalidation on success.
- **No Zod:** ARCHITECTURE says "Types come from `z.infer` — no parallel interfaces" and forms are
  "RHF + Zod." There is no schema and no `zodResolver`, so the payload is unvalidated.
- **Correctness bugs in the fetch itself:** no `Content-Type: application/json` header (server may reject
  the body), the promise is unawaited with no error/`onError` handling and no loading state, and the
  submit button never disables while pending.
- **valueAsNumber missing:** the number input feeds `price` back to RHF as a *string*; `defaultValues`
  declares it `0`. `formatMoney(string)` and the eventual POST body will carry a string where cents
  (number) is expected.

Note the registry currently marks products as **"DESIGN ONLY — no api/hooks/types/schema yet … NOT yet
bound to the API."** This PR is sneaking in a binding through the back door instead of building the
proper layer.

**Fix:** Build the standard binding layer:
- `features/products/schema/product.schema.ts` — Zod `createProductSchema` (`name: string`,
  `price: number` cents) and `productSchema`; types via `z.infer`.
- `features/products/api/products.api.ts` — `createProduct` using `api.post("/products", body)`.
- `features/products/hooks/use-create-product.ts` — `useMutation` that calls it and invalidates
  `["products"]`.
- Wire `useForm({ resolver: zodResolver(createProductSchema) })`, register `price` with
  `valueAsNumber`, and submit via the mutation with disabled/pending + error handling.

### 6. [MAJOR] `ProductsGrid` still renders hardcoded sample data
**Location:** `frontend/src/features/products/template/products-grid.tsx`
```ts
const SAMPLE = [ { name: "Aero Mug", price: "$24.00", inStock: true }, ... ];
```
The grid is unbound and ships static placeholder data. If "products feature changes" is meant to make
the feature functional, the list side is not wired at all. It needs a `useProductsQuery`
(`api.get("/products")` → unwrap envelope → validate with Zod → render). `price` is also a
pre-formatted display string here, which won't match an API that returns numeric cents — the type
contract between card and API needs to be reconciled (format at render with the shared `formatMoney`).

### 7. [MINOR · a11y / quality] `ProductCard` and form fields
**Location:** `product-card.tsx`, `text-field.tsx`, `product-form.tsx`
- Labels in `TextField`/`PriceInput` are not associated with their inputs (`htmlFor`/`id`), hurting
  accessibility. The shared `*Field` components presumably already handle this — another reason to
  reuse them.
- `ProductCard` uses a native `<img>` rather than `next/image`; consider for performance/optimization.
- `inStock` status uses raw color classes; fine for a design stub but worth a shared Badge if reused.

---

## Suggested path to merge
1. Delete `text-field.tsx`; reuse shared `InputField` (and add `NumberField` to shared/form if needed).
2. Remove inline `PriceInput`; use the shared field.
3. Promote `formatMoney` to `src/lib/format.ts`; drop the cross-feature import; update the registry.
4. Replace the `fetch()` with the proper `schema/ api/ hooks/` binding layer (axios + Zod + TanStack
   Query mutation, with `zodResolver`, `valueAsNumber`, error/pending states).
5. Bind `ProductsGrid` to a `useProductsQuery` and reconcile the `price` type (number cents vs display string).
6. Update `MODULE_REGISTRY.md` products row once the feature is actually bound.
