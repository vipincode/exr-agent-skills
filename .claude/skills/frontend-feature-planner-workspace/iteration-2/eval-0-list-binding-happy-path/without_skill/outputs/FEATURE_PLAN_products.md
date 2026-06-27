# Feature Plan — Bind `products` design to the real API

Goal: make the existing (design-only) products grid render real data from the backend
`GET /api/products` endpoint, replacing the hardcoded `SAMPLE` array. This is a binding
plan only — no binding code is written here.

---

## 1. Ground truth — the REAL backend contract

Read directly from `backend/src/modules/products/*` (not guessed).

### Endpoint (list)
`GET /api/products` — **public** (no `protect`, no role). Paginated list.

Query params (`products.schema.ts` → `listProductsQuery`):

| Param    | Type    | Rules / default              |
|----------|---------|------------------------------|
| page     | number  | int ≥ 1, default `1`         |
| limit    | number  | int 1–100, default `20`      |
| search   | string  | optional, trimmed (name regex, case-insensitive) |
| category | string  | optional, trimmed (exact match) |

### Response envelope (fixed — `backend/ARCHITECTURE.md` + `lib/app-response.ts`)
`ok(res, data, message)` →
```json
{ "success": true, "data": <data>, "message": "Products fetched" }
```
For the list endpoint `data` is the **paged payload** (from `products.service.ts`):
```json
{ "items": ProductDTO[], "total": number, "page": number, "limit": number }
```

### `ProductDTO` (the wire shape — `products.service.ts`)
```ts
{
  id: string;
  name: string;
  slug: string;
  price: number;       // INTEGER CENTS (e.g. 2400 = $24.00)
  currency: string;    // ISO 4217, e.g. "USD"
  category: string;
  inStock: boolean;
  imageUrl?: string;   // optional
}
```

### Other endpoints (out of scope for the grid, noted for completeness)
- `GET /api/products/:id` — public, `data: ProductDTO`.
- `POST /api/products` — **admin only** (`protect` + `requireRole("admin")`), 201 `created`.
  Body: `{ name, price (cents), currency?, category, inStock?, imageUrl? }`. Not needed to display the grid.

Error envelope: `{ "success": false, "message": string, "code": string }` with status
(404/409/401/422). axios will reject on non-2xx; surface `error.response.data.message`.

---

## 2. The binding gap (design vs. contract)

The design consumes a **different shape** than the API returns. Two real mismatches:

| Design (`ProductCard` props) | API (`ProductDTO`)          | Action |
|------------------------------|-----------------------------|--------|
| `price: string` e.g. `"$24.00"` | `price: number` (cents) + `currency` | **Format** cents→string at the binding boundary |
| `name: string`               | `name: string`              | pass through |
| `inStock: boolean`           | `inStock: boolean`          | pass through |
| `imageUrl?: string`          | `imageUrl?: string`         | pass through |
| (none)                       | `id`, `slug`, `category`    | use `id` as React key; rest unused for now |

- `ProductsGrid` currently hardcodes a 2-item `SAMPLE`. It must instead call a query hook,
  map `data.items` → `ProductCard`, and handle loading / error / empty states.
- **Do not change the dumb `ProductCard`** — keep it presentational (`price: string`).
  The cents→`"$24.00"` conversion happens in the mapping layer, not in the card.

---

## 3. Infrastructure already in place (reuse — do NOT recreate)

Checked `frontend/MODULE_REGISTRY.md` + `frontend/ARCHITECTURE.md`:

- **BFF proxy** `app/api/[...path]/route.ts` already forwards every `/api/*` to the backend.
  → `GET /api/products` is already reachable from the browser. **No new BFF route needed.**
- **axios** `lib/axios.ts` (`baseURL: "/api"`). → call `api.get("/products", ...)`.
- **TanStack Query v5** QueryClient in `lib/query-client.ts`, provided in `app/providers.tsx`.
  Query keys are arrays, feature-namespaced: `["products", filters]`.
- Types come from `z.infer` — **no parallel hand-written interfaces.**

So binding is purely additive inside `features/products/` — no shared-infra changes.

---

## 4. Files to add (feature module anatomy)

Per `ARCHITECTURE.md`, a feature owns `types/ schema/ api/ hooks/ components/ template/ index.ts`.
The design already supplied `components/` + `template/`. Add the missing layers:

```
src/features/products/
  schema/products.schema.ts     # NEW — Zod schemas (envelope + ProductDTO + list payload + query)
  types/products.types.ts       # NEW — z.infer types only (no parallel interfaces)
  api/products.api.ts           # NEW — axios fn: getProducts(params) -> parsed payload
  hooks/use-products-query.ts    # NEW — useProductsQuery(filters) wrapping useQuery
  lib/format-price.ts (or shared)# NEW — formatPrice(cents, currency) -> "$24.00"
  components/product-card.tsx     # EXISTING — unchanged
  template/products-grid.tsx      # EDIT — remove SAMPLE, consume the hook
  index.ts                        # export template + hook
```

### 4.1 `schema/products.schema.ts` (Zod, mirrors the real contract)
```ts
import * as z from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),     // cents
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().url().optional(),
});

export const listProductsPayloadSchema = z.object({
  items: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// matches backend listProductsQuery (client-side filters)
export const productsFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

// success envelope wrapper for the list endpoint
export const listProductsResponseSchema = z.object({
  success: z.literal(true),
  data: listProductsPayloadSchema,
  message: z.string(),
});
```

### 4.2 `types/products.types.ts`
```ts
import type { z } from "zod";
import type { productSchema, listProductsPayloadSchema, productsFilterSchema } from "../schema/products.schema";

export type Product = z.infer<typeof productSchema>;
export type ProductsPayload = z.infer<typeof listProductsPayloadSchema>;
export type ProductsFilter = z.infer<typeof productsFilterSchema>;
```

### 4.3 `api/products.api.ts`
```ts
import { api } from "@/lib/axios";
import { listProductsResponseSchema } from "../schema/products.schema";
import type { ProductsFilter, ProductsPayload } from "../types/products.types";

export async function getProducts(filters: ProductsFilter): Promise<ProductsPayload> {
  const res = await api.get("/products", { params: filters });   // -> /api/products?page=...&limit=...
  // validate the envelope at the boundary, then return only the payload
  return listProductsResponseSchema.parse(res.data).data;
}
```

### 4.4 `hooks/use-products-query.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/products.api";
import type { ProductsFilter } from "../types/products.types";

export function useProductsQuery(filters: ProductsFilter) {
  return useQuery({
    queryKey: ["products", filters],         // array key, feature-namespaced
    queryFn: () => getProducts(filters),
    placeholderData: (prev) => prev,         // keep page during pagination
  });
}
```

### 4.5 `lib/format-price.ts` — the cents→string adapter
```ts
export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency })
    .format(cents / 100);                    // 2400, "USD" -> "$24.00"
}
```

### 4.6 `template/products-grid.tsx` (EDIT — replace SAMPLE)
Behavior to implement (pseudocode, not final code):
```tsx
export function ProductsGrid() {
  const { data, isLoading, isError } = useProductsQuery({ page: 1, limit: 20 });

  if (isLoading) return <GridSkeleton />;           // loading state
  if (isError)   return <p>Could not load products.</p>;  // error state
  if (!data || data.items.length === 0)
                 return <p>No products yet.</p>;     // empty state

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.items.map((p) => (
        <ProductCard
          key={p.id}
          name={p.name}
          price={formatPrice(p.price, p.currency)}   // <-- the gap fix
          imageUrl={p.imageUrl}
          inStock={p.inStock}
        />
      ))}
    </div>
  );
}
```

---

## 5. Data-binding map (field → component)

| API field (`ProductDTO`) | Transform                         | UI sink (`ProductCard`) |
|--------------------------|-----------------------------------|-------------------------|
| `id`                     | —                                 | React `key`             |
| `name`                   | passthrough                       | `name` (`<h3>`)         |
| `price` + `currency`     | `formatPrice(cents, currency)`    | `price` (`<p>`)         |
| `inStock`                | passthrough                       | `inStock` badge         |
| `imageUrl?`              | passthrough                       | `<img>` (conditional)   |
| `slug`, `category`       | unused for the grid (future: filter/detail link) | — |
| `total/page/limit`       | future pagination control         | —                       |

---

## 6. Auth note
List + get are **public** — no token, no `useAuth` gating required to display the grid.
`useAuth` (role accessor) is only relevant later for the admin-only `POST /api/products`,
which is out of scope for this binding.

---

## 7. Risks / decisions to confirm
1. **Price units**: backend stores/returns **integer cents**. Formatting must divide by 100.
   (Confirmed in model + schema comments.) Do not treat `price` as dollars.
2. **Envelope unwrap**: the list payload is nested at `data.items` (envelope `data` → `{items,...}`).
   Two levels: `res.data.data.items`. The Zod parse above makes this explicit.
3. Keep `ProductCard` presentational; no API types leak into it. Reversible if a richer card is needed.
4. Validation strictness: if backend may add fields, consider `.passthrough()` or loosening the
   envelope schema so extra fields don't throw. Default plan validates strictly for safety.

---

## 8. Done = 
- `ProductsGrid` shows live `/api/products` results, paginated payload unwrapped, prices formatted.
- No `SAMPLE` array remains; loading / error / empty handled.
- New files confined to `features/products/`; registry updated to list `api/ hooks/ types/ schema/`.
- No shared-infra or backend changes.
