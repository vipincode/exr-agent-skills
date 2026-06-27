# Module Registry — demo-web (frontend)
Check here FIRST before creating any component/hook/util/type.

## Shared form fields (src/components/shared/form/)
| Name | Path |
|---|---|
| InputField | components/shared/form/input-field.tsx |
| SelectField | components/shared/form/select-field.tsx |
| TextareaField | components/shared/form/textarea-field.tsx |
| CheckboxField | components/shared/form/checkbox-field.tsx |

## Shared library (src/lib/)
| Name | Path | Purpose |
|---|---|---|
| api (axios) | lib/axios.ts | one axios, baseURL /api |
| queryClient | lib/query-client.ts | single TanStack QueryClient |

## App infrastructure
| Name | Path | Purpose |
|---|---|---|
| BFF proxy | app/api/[...path]/route.ts | forwards /api/* to backend |

## Hooks (src/hooks/)
| Name | Path | Purpose |
|---|---|---|
| useAuth | hooks/use-auth.ts | current user/role accessor |

## Features (src/features/)
| Feature | Path | Owns | Notes |
|---|---|---|---|
| products | src/features/products | components/, template/, types/, schema/, api/, hooks/, lib/, index.ts | list binding wired to GET /api/products (TanStack Query + Zod-validated envelope) |

### products module surface (src/features/products/)
| Name | Path | Purpose |
|---|---|---|
| productSchema / productListDataSchema / productsEnvelopeSchema / productFiltersSchema | features/products/schema/products.schema.ts | Zod schemas mirroring the backend ProductDTO + success envelope; source of all products types |
| Product / ProductListResponse / ProductFilters | features/products/types/products.ts | z.infer types (no parallel interfaces) |
| fetchProducts | features/products/api/products.api.ts | GET /api/products via the shared axios `api`; unwraps + Zod-parses the envelope |
| useProductsQuery | features/products/hooks/use-products.ts | TanStack Query hook, key ["products", filters], default page 1 / limit 20 |
| formatPrice | features/products/lib/format-price.ts | integer cents + currency → display string via Intl.NumberFormat |
| ProductsGrid | features/products/template/products-grid.tsx | bound grid (loading/empty/error states) — renders live products |
| ProductCard | features/products/components/product-card.tsx | presentational card (unchanged); fed mapped props |
