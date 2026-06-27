# Auth, the BFF, and the token strategies

The backend connection is **always a BFF proxy**: the browser only ever calls same-origin `/api/...`,
and Route Handlers under `app/api/` forward to the real backend with auth attached. This hides the
backend URL and keeps tokens out of client JS. What varies is **how tokens are stored and moved** —
the scaffold-time choice. Read this before generating the auth wiring (workflow step 7).

## Files involved

| File | Role |
| --- | --- |
| `app/api/[...path]/route.ts` | catch-all proxy → backend; attaches Bearer token from cookie |
| `app/api/auth/login/route.ts` | logs in against backend; applies the chosen strategy |
| `app/api/auth/refresh/route.ts` | silent refresh rotation (only if enabled) |
| `lib/auth/session.ts` | server-side cookie read/set/clear (`next/headers`) |
| `lib/auth/tokens.ts` | cookie names, options, JWT-payload role decode |
| `lib/axios.ts` | the `/api` instance + the 401→refresh interceptor |
| `proxy.ts` | role-based redirects (reads the cookie off the request). Next 16+ name; `middleware.ts` / `middleware` on ≤15 |
| `lib/auth/roles.ts` | role → route map (extensible) |

The BFF proxy route, `proxy.ts` (role routing), and `roles.ts` are the **same across all strategies**. Only the login/refresh
handlers, `session.ts`, `tokens.ts`, and the axios interceptor change.

## Strategy (a) — body → cookies  *(default; shipped as-is)*

Backend returns `{ accessToken, refreshToken }` in the login response body; the Next login Route
Handler sets them as **httpOnly cookies** via `setSession`. The proxy reads the access cookie and
forwards it as `Authorization: Bearer`. This is what the bundled files implement.

- Most secure: tokens never touch client JS; backend URL hidden.
- Adjust the property paths in `login/route.ts` to match the backend's actual response shape.

## Strategy (b) — backend sets cookies

The backend already responds with `Set-Cookie` on login. Next should **forward those cookies** rather
than minting its own. Changes:

- `login/route.ts`: don't call `setSession`. Instead copy the backend response's `set-cookie`
  header(s) onto the `NextResponse`. The browser stores them (httpOnly, same-site as the backend set).
- proxy `[...path]/route.ts`: forward the incoming `cookie` header to the backend (it already does, via
  copying request headers) and forward `set-cookie` back. You can drop the Bearer-from-`getSession`
  step since the backend authenticates by cookie.
- `session.ts`: `getSession` reads whatever cookie name the backend uses (still fine for routing).
- refresh: usually the backend rotates its own cookie on a refresh call; the Next refresh handler just
  forwards it.

## Strategy (c) — header / client-stored tokens

Tokens are kept client-side (memory or `localStorage`) and sent via `Authorization` header. Less
secure (XSS-exposed); offer it but say so. Changes:

- `login/route.ts`: return `{ accessToken, refreshToken, user }` in the body (don't set cookies).
- `lib/auth/tokens.ts`: add a small client token store (get/set/clear in memory or `localStorage`).
- `lib/axios.ts`: a **request** interceptor attaches `Authorization: Bearer <stored access token>`.
  The proxy then forwards that header to the backend (it already forwards request headers).
- `proxy.ts`: it can't read a client-stored token, so route protection moves client-side (a guard
  in a layout) or to a lightweight cookie that only holds the role for routing. Note this tradeoff in
  `ARCHITECTURE.md`.

## Refresh-token rotation (add-on, default ON)

Layered on top of (a)/(b)/(c). On a `401`, the axios response interceptor calls `/api/auth/refresh`
once and replays the original request. The refresh Route Handler uses the refresh token (cookie for
a/b, body/header for c) to get a new access token from the backend and rotates storage server-side.

- Bundled in `lib/axios.ts` (interceptor) + `app/api/auth/refresh/route.ts`.
- If the user picks **no rotation**, delete the interceptor block in `lib/axios.ts` and the refresh
  route, and note it in `ARCHITECTURE.md`.

## Role-based routing (all strategies)

`proxy.ts` reads the access-token cookie (a/b) and decodes the `role` claim **without verifying
the signature** — purely to pick which dashboard to redirect to. Real authorization happens at the
backend on every BFF call, so a forged cookie buys only a redirect. To add a role, add one entry to
`ROLE_ROUTES` in `lib/auth/roles.ts`; `proxy.ts` needs no change.

When filling `ARCHITECTURE.md`, set `{{TOKEN_STRATEGY}}` to a one-paragraph description of the chosen
strategy, `{{TOKEN_STRATEGY_SHORT}}` to a short label (e.g. "body→cookies + refresh rotation"),
`{{REFRESH_NOTE}}` to " Refresh-token rotation is enabled." or "", and `{{ROLE_ROUTES}}` to the actual
map (e.g. `admin→/admin, user→/user`).
