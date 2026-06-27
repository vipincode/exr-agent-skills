# Binding anatomy

What each file in a feature module's binding layer should contain. The feature anatomy is fixed by `ARCHITECTURE.md` / `nextjs-bootstrap`; this is what the *binding* (the API-functional part) adds to it. Authoring style is React function components + hooks. Match the project's import-alias convention (e.g. `@/lib/axios`).

```
features/<name>/
  types/        domain types — derived from the Zod schemas via z.infer (no parallel interfaces)
  schema/       Zod schemas: domain shape, the success envelope, request/form payloads, filters
  api/          request functions — call the shared axios `api`, unwrap the envelope, Zod-parse data
  hooks/        TanStack Query/mutation hooks (array keys, invalidation)
  components/   feature-only components (created only if the plan needs new ones; reuse first)
  template/     the composed screen(s) — EDITED to consume the hooks (page.tsx stays thin)
  index.ts      barrel re-exporting the module's public surface
  <util>.ts     feature-local helpers (e.g. format-price) — single-use, not registered
```

## `schema/<name>.schema.ts` — Zod schemas (the contract mirror)
Mirror the **observed** envelope from the plan's "API contract (observed)" exactly. Typically:
- `productSchema` (the domain shape — field types from the plan, e.g. `price: z.number().int()` for cents).
- a list-data schema (`{ items: productSchema[], total, page, limit }`) if the endpoint is paged.
- an **envelope schema** (`{ success: z.literal(true), data: <dataSchema>, message: z.string().optional() }`) so envelope drift fails loudly.
- request/form schemas for mutations (`createProductSchema`, …) and an optional `filters` schema for the query arg.
Export inferred types with `z.infer` — one source of truth for shapes.

## `types/<name>.ts` — types from Zod
`export type Product = z.infer<typeof productSchema>` etc. Add module-local types here only if they aren't derived from a schema. If a type is needed by another feature, it isn't feature-local — move it to a shared location.

## `api/<name>.api.ts` — request functions
Each fn calls the shared `api` axios instance (never a new instance, never the backend's absolute URL), then unwraps + validates:
```ts
import { api } from "@/lib/axios";
import { productsEnvelopeSchema } from "../schema/products.schema";

export async function fetchProducts(filters?: ProductFilters) {
  const res = await api.get("/products", { params: filters });
  return productsEnvelopeSchema.parse(res.data).data; // unwrap { success, data } + fail loudly on drift
}
```
No `try/catch` that swallows errors here — let them propagate to the query hook's error state. Mutations post the request schema's validated body and return the parsed `data`.

## `hooks/use-<name>.ts` — TanStack Query
Server state only. Array keys namespaced by feature; mutations invalidate.
```ts
export function useProductsQuery(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}
export function useCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
```
Use `placeholderData: keepPreviousData` for smooth paging when the plan calls for it; `useInfiniteQuery` only if the plan chose infinite scroll. Do optimistic updates only when the plan specifies them (with rollback in `onError`).

## `template/<name>-*.tsx` — wire the built screen
Edit the existing composed screen to consume the hook instead of hardcoded data. Render the three states explicitly:
```tsx
const { data, isPending, isError } = useProductsQuery();
if (isPending) return <ProductsGridSkeleton />;       // lightweight stub OK if design has none
if (isError)   return <p role="alert">Couldn’t load products.</p>;
if (!data.items.length) return <EmptyState>No products yet.</EmptyState>;
return <div className="...">{data.items.map((p) => (
  <ProductCard key={p.id} name={p.name} price={formatPrice(p.price, p.currency)} inStock={p.inStock} imageUrl={p.imageUrl} />
))}</div>;
```
The presentational component (`ProductCard`) stays unchanged — it receives clean, already-transformed props. Transforms (cents→currency string, date formatting) live in a feature-local util or inline in the map, not in the card.

## Forms (when the binding includes one)
`useForm({ resolver: zodResolver(createProductSchema) })` inside `<FormProvider {...form}>`; every field is a shared `*Field` (`InputField`, `SelectField`, …) — no raw `useController`. Submit calls the mutation; disable the submit button while `isPending`; surface the mutation error inline. Gate admin-only forms/actions with `useAuth().user?.role`.

## `index.ts` — public surface
Re-export what other code may import (the hooks, the screen template, the domain types). Keep internal helpers (the api fns, the format util) unexported unless another module legitimately needs them — and if it does, that's a signal to move them to `lib`/`services`.

## BFF routes — usually omit
The catch-all proxy (`app/api/[...path]/route.ts`) already forwards `/api/<name>` → backend. Add `app/api/<name>/route.ts` **only** when the plan says the proxy is insufficient (e.g. this route needs server-side reshaping, a different auth treatment, or to hide a field). Default is to omit it.
