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
| useAuth | hooks/use-auth.ts | current user/role/token accessor + `setSession` / `clearSession` (localStorage-backed store) |

## Features (src/features/)
| Feature | Path | Owns | Notes |
|---|---|---|---|
| products | src/features/products | components/, template/ (DESIGN ONLY — no api/hooks/types/schema yet) | built by figma-to-component; NOT yet bound to the API |
| auth | src/features/auth | `RegisterForm` (template), `useRegisterMutation`, `registerRequestSchema` / `authUserSchema`, `RegisterRequest` / `RegisterData` / `AuthUser` types, `AUTH_QUERY_KEYS` | slice 01 (register) bound to POST /api/auth/register; the register form is a STOPGAP shared-*Field form, not a design |

## Decisions
- Auth session (user + bearer token) lives in the shared `useAuth` store (localStorage, `auth.session`), set on register/login and cleared on logout — features never keep their own copy.
- Auth query-key root is `["auth"]`; the session key is `["auth", "session"]` (`features/auth/constants/auth.ts`).
- Every auth request goes through the shared axios instance → same-origin `/api/...` → the BFF catch-all. No feature-specific BFF route was needed.
- Responses are envelope-parsed with Zod (`registerEnvelopeSchema`) before use, so contract drift throws instead of rendering garbage.
- OPEN: the module plan says the BFF forwards the bearer token; the proxy implementation is elided in this repo, so nothing attaches `Authorization` yet. Settle this (httpOnly cookie or an axios request interceptor) before slice 03.
