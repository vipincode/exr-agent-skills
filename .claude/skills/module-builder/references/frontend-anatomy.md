# Binding anatomy

What each file in a feature module's binding layer should contain. The feature anatomy is fixed by `ARCHITECTURE.md` / `nextjs-bootstrap`; this is what the *binding* (the API-functional part) adds to it. Authoring style is React function components + hooks. Match the project's import-alias convention (e.g. `@/lib/axios`).

```
features/<name>/
  types/        domain types — derived from the Zod schemas via z.infer (no parallel interfaces)
  constants/    domain constants, enums, option lists, query-key roots (or constants.ts)
  schema/       Zod schemas: domain shape, the success envelope, request/form payloads, filters
  api/          request functions — call the shared axios `api`, unwrap the envelope, Zod-parse data
  hooks/        TanStack Query/mutation hooks (array keys, invalidation)
  components/   feature-only components (created only if the plan needs new ones; reuse first)
  template/     the composed screen(s) — EDITED to consume the hooks (page.tsx stays thin)
  index.ts      barrel re-exporting the module's public surface
  <util>.ts     feature-local helpers (e.g. format-price) — single-use, not registered
```

## Edit scope for one slice (frontend)

| May create/edit | Only when |
|---|---|
| `src/features/<name>/**` | always — this is the slice's home |
| the thin `src/app/**/page.tsx` that renders the feature template | the slice adds/changes a route |
| `MODULE_REGISTRY.md` | always — feature row, new shared pieces, decisions |
| `components/shared`, `lib`, `hooks`, `services`, `types`, `constants` | the dedup gate decided a shared piece must be created or extended — name each in the hand-off |
| `components/shared/icons.tsx` | adding an icon to the registry's export list |
| another feature's files | **never**, unless the slice file lists the change — import its barrel instead |

Lint (`eslint.boundaries.mjs`) rejects cross-feature imports, deep imports past a feature's barrel, icon-library and `axios` imports outside their one home, and `process.env` outside `lib/env.ts`. A lint error means the code is in the wrong place — move it, never loosen the rule.

## `schema/<name>.schema.ts` — Zod schemas (the contract mirror)
Mirror the slice's **API contract** `data` shape exactly. The envelope itself is **not** re-declared per feature — `lib/api/envelope.ts` owns it (`{ success, data, meta? }`, with `pageMetaSchema` for lists). So a feature schema file holds:
- `productSchema` — the domain shape of one item (field types from the contract, e.g. `priceCents: z.number().int()`).
- request/form schemas for mutations (`createProductSchema`, …) and a `listProductsQuerySchema` for list params (`page`, `limit`, filters) when the endpoint paginates.
Export inferred types with `z.infer` — one source of truth for shapes. (Projects not on the bootstrap envelope: mirror the observed envelope here and note it in ARCHITECTURE.md.)

## `types/<name>.ts` — types from Zod
`export type Product = z.infer<typeof productSchema>` etc. Add module-local types here only if they aren't derived from a schema. If a type is needed by another feature, it isn't feature-local — move it to `src/types/` and register it.

## `constants/<name>.ts` — domain constants
Enums, option lists (e.g. category/status options for selects), fixed limits, and the feature's query-key root. No magic literals in components or hooks — name them here. If a constant/enum is needed by another feature, move it to `src/constants/` and register it.

## `api/<name>.api.ts` — request functions
Each fn calls the shared `api` axios instance (never a new instance, never the backend's absolute URL), then unwraps + validates with the shared envelope helpers:
```ts
import { api } from "@/lib/axios";
import { parseData, parsePaginated } from "@/lib/api/envelope";
import { productSchema, type CreateProductInput, type ListProductsQuery } from "../schema/products.schema";

export async function fetchProducts(query: ListProductsQuery) {
  const res = await api.get("/products", { params: query });
  return parsePaginated(productSchema, res.data); // → { items, meta: { page, limit, total, totalPages } }
}

export async function createProduct(input: CreateProductInput) {
  const res = await api.post("/products", input);
  return parseData(productSchema, res.data); // unwrap { success, data } + fail loudly on drift
}
```
No `try/catch` that swallows errors here — let them propagate to the query hook's error state. Turning an error into UI text is `toApiError(error).message` (from `@/lib/api/errors`), done where it's displayed.

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

## `components/` — new feature components (rare; reuse first)
Only created when the plan needs a piece that doesn't exist anywhere. When you do write one:
- **Class grouping via `cn()`** (from `@/lib/utils`) — conditional and merged Tailwind classes go through `cn(...)`, never template-string concatenation, so conflicting utilities resolve correctly and a caller-supplied `className` can be composed last.
- **Variants via `cva`** (class-variance-authority) — visual variants (size, tone, state) are a `cva` definition with `variants` + `defaultVariants`, applied as `cn(cardVariants({ size, tone }), className)`. No boolean-ternary class chains or hand-rolled `Record<Variant, string>` maps; this matches how every shadcn component in `components/ui/` is built.
- **Tabular data → `DataTable` by default.** shadcn offers plain `Table` primitives (static markup) and the `DataTable` pattern (TanStack Table: column defs, sorting, pagination, row selection). Flag which one you intend to use before building; absent an answer or a plan directive, default to `DataTable` — API-bound lists almost always grow into sorting/paging needs.

## `template/<name>-*.tsx` — wire the built screen
Edit the existing composed screen to consume the hook instead of hardcoded data. Render the three states explicitly:
```tsx
const { data, isPending, isError } = useProductsQuery();
if (isPending) return <ProductsGridSkeleton />;       // lightweight stub OK if design has none
if (isError)   return <p role="alert">Couldn’t load products.</p>;
if (!data.items.length) return <EmptyState>No products yet.</EmptyState>; // data = { items, meta }
return <div className="...">{data.items.map((p) => (
  <ProductCard key={p.id} name={p.name} price={formatPrice(p.price, p.currency)} inStock={p.inStock} imageUrl={p.imageUrl} />
))}</div>;
```
The presentational component (`ProductCard`) stays unchanged — it receives clean, already-transformed props. Transforms (cents→currency string, date formatting) live in a feature-local util or inline in the map, not in the card.

## Forms (when the binding includes one)
`useForm({ resolver: zodResolver(createProductSchema) })` inside `<FormProvider {...form}>`; every field is a shared `*Field` (`InputField`, `SelectField`, …) — no raw `useController`. Submit calls the mutation; disable the submit button while `isPending`. On error, put the backend's validation errors on the fields and fall back to a form-level message:
```tsx
const mutation = useCreateProductMutation();
const onSubmit = form.handleSubmit((values) =>
  mutation.mutate(values, {
    onError: (error) => {
      if (!applyServerErrors(error, form.setError)) setFormError(toApiError(error).message);
    },
  }),
);
```
Gate admin-only forms/actions with `useAuth().user?.role`.

## `index.ts` — public surface
Re-export what other code may import (the hooks, the screen template, the domain types). Keep internal helpers (the api fns, the format util) unexported unless another module legitimately needs them — and if it does, that's a signal to move them to `lib`/`services`.

## BFF routes — usually omit
The catch-all proxy (`app/api/[...path]/route.ts`) already forwards `/api/<name>` → `BACKEND_URL/<name>` (BACKEND_URL includes `/api/v1`). Add `app/api/<name>/route.ts` **only** when the plan says the proxy is insufficient (e.g. this route needs server-side reshaping, a different auth treatment, or to hide a field). Default is to omit it. When you do add one, build it from `lib/bff.ts` (`backendUrl`, `upstreamHeaders`, `bffError`) so it forwards the request id + client IP and answers in the shared envelope.
