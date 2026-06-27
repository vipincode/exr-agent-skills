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
| products | src/features/products | components/, template/, types/, schema/, api/, hooks/, index.ts | create binding wired to `POST /api/products` (admin); grid/detail still display-only |

## Products feature surface (src/features/products/)
| Name | Path | Purpose |
|---|---|---|
| createProductInput / productSchema | features/products/schema/products.schema.ts | Zod form input + response schema (types via z.infer) |
| Product / ProductListResponse | features/products/types/products.ts | inferred DTO + list-response type |
| createProduct | features/products/api/products.api.ts | POST /products via shared axios; dollars→cents; unwrap+validate |
| useCreateProductMutation | features/products/hooks/use-products.ts | create mutation; invalidates ["products"] on success |
| ProductForm | features/products/components/product-form.tsx | RHF + shared *Field create form; maps 422/409/401 to fields |
| ProductCreate | features/products/template/product-create.tsx | admin-gated screen; toast + redirect on success |
| route | app/admin/products/new/page.tsx | renders ProductCreate |
