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
| useAuth | hooks/use-auth.ts | current user/role accessor (read-only — no session setter yet) |

## Features (src/features/)
| Feature | Path | Owns | Notes |
|---|---|---|---|
| products | src/features/products | components/, template/ (DESIGN ONLY — no api/hooks/types/schema yet) | built by figma-to-component; NOT yet bound to the API |
| auth | src/features/auth | schema/, types/, constants/, api/, hooks/ | BINDING ONLY — public surface: `useRegister`, `useLogin`, `useLogout`, `registerRequestSchema`, `loginRequestSchema`, `AUTH_QUERY_KEY`, `AuthUser`/`AuthSession`/`RegisterInput`/`LoginInput`. **No design yet** — register/login forms and the header user menu still have to be built (figma-to-component / html-to-component) and then wired to these hooks. |

## Decisions log
- **auth**: the token comes back in the response body; the browser never calls the backend
  directly — everything goes through the shared axios `api` + the catch-all BFF proxy.
- **auth**: query keys are namespaced under `AUTH_QUERY_KEY = ["auth"]`; all three operations are
  mutations, and logout invalidates in `onSettled` so it clears locally even when the request fails.
- **auth**: responses are Zod-parsed through an envelope schema, so contract drift fails loudly.
  Logout is the exception — the backend returns **204 with an empty body**, not `data: null` as the
  plan's observed contract states, so the request fn accepts both.
- **auth**: session persistence is NOT wired — `useAuth` is still a read-only stub with no
  `setSession`/`clearSession`. Turning it into a real session store is a separate change.
