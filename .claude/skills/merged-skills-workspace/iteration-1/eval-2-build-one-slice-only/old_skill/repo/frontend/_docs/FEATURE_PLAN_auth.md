# Feature plan: auth

> Status: draft — edit freely, then hand to frontend-module-builder.

## Overview
Bind the auth screens to the auth API: register, login, logout.

## API contract (observed)
| Method | Path | Auth | Request | Response `data` |
|--------|------|------|---------|-----------------|
| POST | /auth/register | public | `{ email, password, name }` | `{ user: { id, email, name, role }, token }` |
| POST | /auth/login | public | `{ email, password }` | `{ user: { id, email, name, role }, token }` |
| POST | /auth/logout | protect | — | `null` |

Success envelope: `{ success: true, data, message }`. Error: `{ success: false, error: { code, message } }`.
Source: the backend feature plan at `backend/_docs/FEATURE_PLAN_auth.md`.

## Dependencies
The auth endpoints above must exist. Requires `BACKEND_URL`.

## Reuse (do NOT recreate)
| What | Path |
|------|------|
| axios instance | src/lib/axios.ts |
| BFF catch-all proxy | src/app/api/[...path]/route.ts |
| shared form fields | src/components/shared/form/index.ts |
| useAuth | src/hooks/use-auth.ts |

## Types & schema
Types via `z.infer` of the request/response schemas — no parallel interfaces.

## Create
| File | Purpose |
|------|---------|
| src/features/auth/schema/auth.schema.ts | request + response schemas |
| src/features/auth/api/register.ts | register request fn |
| src/features/auth/api/login.ts | login request fn |
| src/features/auth/api/logout.ts | logout request fn |
| src/features/auth/hooks/use-register.ts | mutation hook |
| src/features/auth/hooks/use-login.ts | mutation hook |
| src/features/auth/hooks/use-logout.ts | mutation hook |

The catch-all proxy already covers `/api/auth/*` — no dedicated route handler needed.

## Data mapping
| Component (path) | Bound to |
|---|---|
| src/features/auth/template/register-form.tsx | useRegister mutation |
| src/features/auth/template/login-form.tsx | useLogin mutation |
| the header user menu | useLogout mutation |

## Query/mutation hooks
All three are mutations. On success they store/clear the session via `useAuth` and invalidate
`["auth", ...]` keys.

## Design gaps
The register form, login form, and header user menu do not exist yet — build with
figma-to-component / html-to-component.

## Edge cases & states
Submit pending disables the button; 409 on register shows inline on the email field; 401 on login
shows at form level; logout clears locally even if the request fails.

## Testing checklist
- [ ] valid register creates the user and returns the envelope above
- [ ] duplicate email returns 409 and shows inline on the email field
- [ ] password under 8 chars is rejected client-side before any request
- [ ] wrong password and unknown email return the same 401 message
- [ ] responses are envelope-unwrapped and Zod-validated
- [ ] logout clears the session and invalidates auth keys

## Out of scope
Password reset, social login, two-factor.

## Open questions
None.
