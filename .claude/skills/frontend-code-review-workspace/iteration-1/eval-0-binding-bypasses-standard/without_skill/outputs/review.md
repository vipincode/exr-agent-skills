# Code Review — `frontend/src/features/products/` (products list binding)

**Scope reviewed:** `features/products/template/products-grid.tsx`, `features/products/components/product-card.tsx`
**Reviewed against:** `frontend/ARCHITECTURE.md`, `frontend/MODULE_REGISTRY.md`, and the real backend contract (`backend/src/modules/products/*`, `backend/ARCHITECTURE.md`).
**Mode:** Read-only. No source files were modified.

---

## Verdict: ❌ Request changes (do not merge)

The products list "works" only by accident in the happy path, and in this codebase it does not even work in the happy path. `products-grid.tsx` bypasses every layer of the project's data-binding standard (BFF proxy → shared axios → TanStack Query → Zod) and contains a **real runtime bug** that makes the fetch fail in the browser. It also leaves the feature module incomplete (no `types/ schema/ api/ hooks/`), contradicting the architecture and the registry plan for this feature.

This needs to be rebound through the standard stack before it ships.

---

## Findings

### 🔴 BLOCKER 1 — `process.env.BACKEND_URL` is `undefined` in the browser (runtime bug)
**Location:** `template/products-grid.tsx:11`

```ts
fetch(`${process.env.BACKEND_URL}/products?page=1&limit=20`)
```

This is a `"use client"` component, so this code runs in the browser. Next.js only inlines env vars prefixed with `NEXT_PUBLIC_` into client bundles. `BACKEND_URL` is a **server-only** variable (it is what the BFF proxy uses on the server). In the browser `process.env.BACKEND_URL` evaluates to `undefined`, so the request goes to `undefined/products?page=1&limit=20` and fails. The grid will silently render empty.

Even if the value existed, calling the backend origin directly from the browser violates the architecture ("The browser only ever calls same-origin `/api/...` … never direct") and would break on CORS/auth.

**Fix:** Never reference `BACKEND_URL` from client code. Call the same-origin BFF via the shared axios instance (see Blocker 2 fix).

---

### 🔴 BLOCKER 2 — Binding bypasses the BFF/axios/Zod/Query standard
**Location:** `template/products-grid.tsx:1-29`

The architecture mandates a specific data path; this component skips all of it:

| Standard (ARCHITECTURE.md / registry) | This code |
|---|---|
| Browser calls same-origin `/api/*` via BFF proxy | Calls backend origin directly with `BACKEND_URL` |
| Use shared axios `api` (`lib/axios.ts`, `baseURL:"/api"`) | Uses raw `fetch` |
| Server state via TanStack Query v5 (`useXQuery`, query keys `["products", filters]`) | `useEffect` + `useState` |
| Response validated with Zod; types from `z.infer` | Untyped `any[]`, no validation |
| Feature owns `types/ schema/ api/ hooks/` | All logic inlined into the `template/` |

The registry explicitly notes products is "DESIGN ONLY — no api/hooks/types/schema yet … NOT yet bound to the API." The binding was supposed to add those layers; instead a raw fetch was dropped into the template.

**Concrete fix — create the missing module layers and consume them:**

`features/products/schema/product.schema.ts`
```ts
import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().url().optional(),
});

export const productListSchema = z.object({
  items: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Backend success envelope: { success, data, message }
export const productListResponseSchema = z.object({
  success: z.literal(true),
  data: productListSchema,
  message: z.string().optional(),
});
```

`features/products/types/product.ts`
```ts
import type { z } from "zod";
import type { productSchema, productListSchema } from "../schema/product.schema";

export type Product = z.infer<typeof productSchema>;
export type ProductList = z.infer<typeof productListSchema>;
```

`features/products/api/products.api.ts`
```ts
import { api } from "@/lib/axios";
import { productListResponseSchema } from "../schema/product.schema";
import type { ProductList } from "../types/product";

export async function fetchProducts(params: { page: number; limit: number }): Promise<ProductList> {
  const res = await api.get("/products", { params });
  return productListResponseSchema.parse(res.data).data; // unwrap envelope + validate
}
```

`features/products/hooks/use-products-query.ts`
```ts
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/products.api";

export function useProductsQuery(filters: { page: number; limit: number }) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}
```

`template/products-grid.tsx` (rebound)
```tsx
"use client";
import { useProductsQuery } from "../hooks/use-products-query";
import { ProductCard } from "../components/product-card";

export function ProductsGrid() {
  const { data, isPending, isError } = useProductsQuery({ page: 1, limit: 20 });

  if (isPending) return <div className="text-muted-foreground">Loading products…</div>;
  if (isError)   return <div className="text-red-500">Couldn’t load products. Try again.</div>;
  if (data.items.length === 0) return <div className="text-muted-foreground">No products found.</div>;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.items.map((p) => (
        <ProductCard
          key={p.id}
          name={p.name}
          price={new Intl.NumberFormat(undefined, { style: "currency", currency: p.currency }).format(p.price)}
          imageUrl={p.imageUrl}
          inStock={p.inStock}
        />
      ))}
    </div>
  );
}
```

Then add `features/products/index.ts` barrel exports and update `MODULE_REGISTRY.md` (products now owns api/hooks/types/schema).

---

### 🟠 MAJOR 3 — No loading / error / empty states; rejected promise is swallowed
**Location:** `template/products-grid.tsx:9-14`

The `.then(...).then(...)` chain has no `.catch`. On any failure (which is guaranteed here per Blocker 1) the grid renders blank with no feedback, and the unhandled rejection is lost. There is no loading indicator and no empty state.

**Fix:** Handled for free by the TanStack Query rebind above (`isPending` / `isError` / empty check). Query also gives caching, retries, and dedup.

---

### 🟠 MAJOR 4 — Untyped data (`any`) defeats type safety
**Location:** `template/products-grid.tsx:7,18`

```ts
const [products, setProducts] = useState<any[]>([]);
...
{products.map((p: any) => ( ... ))}
```

`any` disables every compile-time guarantee on a network boundary. The architecture requires types from `z.infer` (no parallel interfaces). After the Zod rebind, `data.items` is typed `Product[]` and the `any`s disappear.

---

### 🟡 MINOR 5 — Currency hardcoded to `$`, ignoring the backend `currency` field
**Location:** `template/products-grid.tsx:22`

```ts
price={`$${p.price}`}
```

The backend DTO returns both `price: number` and `currency: string` (see `backend/src/modules/products/products.service.ts`). Hardcoding `$` mislabels any non-USD product and string-concatenates a number. Use `Intl.NumberFormat` with `p.currency` (shown in the fix above).

---

### 🟡 MINOR 6 — No request cancellation / race protection
**Location:** `template/products-grid.tsx:9-14`

The bare `useEffect` fetch has no abort handling, so overlapping requests (e.g. future filter changes) can race and set stale state. TanStack Query handles cancellation and last-write-wins via query keys, so adopting it (Blocker 2) resolves this too.

---

## Notes / non-issues
- `product-card.tsx` is fine as a presentational component. Keeping it prop-driven (no data fetching inside) is the right call; only the price string it receives needs the currency fix at the call site.
- The envelope path `json.data.items` happens to match the real backend shape (`{ success, data: { items, total, page, limit }, message }`), but reading it unvalidated is still wrong — validate with Zod and unwrap in the api layer.

## Suggested fix order
1. Add `schema/`, `types/`, `api/`, `hooks/` to `features/products/` (Blocker 2).
2. Rebind `products-grid.tsx` to `useProductsQuery`, removing the direct fetch / `BACKEND_URL` reference (Blockers 1 & 2, Majors 3 & 4, Minor 6).
3. Fix currency formatting at the `ProductCard` call site (Minor 5).
4. Add `index.ts` barrel and update `MODULE_REGISTRY.md`.
