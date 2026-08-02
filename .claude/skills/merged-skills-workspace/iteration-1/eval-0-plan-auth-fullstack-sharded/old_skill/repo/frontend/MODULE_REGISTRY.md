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
| products | src/features/products | components/, template/ (DESIGN ONLY — no api/hooks/types/schema yet) | built by figma-to-component; NOT yet bound to the API |
