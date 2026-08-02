# Reading the backend — the resolution ladder (observe mode)

Use this when the backend **already exists** and this plan isn't designing it: built by an earlier
module, owned by another team, or a third-party API. The slice's contract must then be **observed**,
not declared. (In design mode — we own the backend and these endpoints don't exist yet — skip this
file entirely; the slice declares the contract and the backend half implements it.)

Take the **highest-fidelity source you can reach** and stop there. Record which rung you used on the
slice's `Source:` line so the user and `module-builder` can judge how much to trust it.

The single fact that matters most is the **success envelope** — the exact JSON the endpoint
returns. The frontend types, schemas, and any BFF route all mirror it. A wrong envelope is the
number-one cause of bindings that compile but break at runtime, so confirm it from ground truth.

Mode can differ **per slice**: slice 01 may observe an existing `GET /products` while slice 02
designs a new `POST /products`. Decide per slice and record the source accordingly.

---

## Rung 1 — Monorepo backend source (best)

When `.claude/workspace.json` has a `backend` entry, the real code is right there. Resolve that
project dir and read the chain for the requested capability:

```
src/app.ts                       → where routers mount (find the base path, e.g. /products)
src/modules/<name>/<name>.routes.ts      → method + path + which middleware (auth/validate)
src/modules/<name>/<name>.controller.ts  → what it returns: the envelope helper + data
src/modules/<name>/<name>.service.ts     → the shape of `data` (what the service resolves)
src/modules/<name>/<name>.schema.ts      → request shape (body/query/params Zod schemas)
src/modules/<name>/<name>.model.ts       → the persisted document shape (fields, types)
```

Extract, per endpoint:
- **Method + full path** (router mount base + route path).
- **Auth guard** — `protect` / `requireRole('admin')` / public. This decides whether the BFF
  route needs the session and whether the UI gates the action by role.
- **Request shape** — path params, query params (filters/pagination), and body fields with types.
- **Success envelope + `data` shape** — read the controller's response helper. The backend
  ARCHITECTURE.md fixes the envelope (commonly `{ success: true, data, message }`); the `data`
  shape comes from the service return / model. Note list vs single, and any pagination meta
  (`total`, `page`, `limit`).
- **Error cases** — which `AppError` subclasses / status codes the path throws (404/409/401/422).

Read the backend's `ARCHITECTURE.md` once to confirm the envelope and error model rather than
inferring it per-controller.

## Rung 2 — Backend contract files

If source isn't fully readable (partial repo, generated code) but the backend's `ARCHITECTURE.md`
and `MODULE_REGISTRY.md` are present, use them: the envelope + error model from ARCHITECTURE.md,
and the module's **public service surface** (functions + what they return) from MODULE_REGISTRY.md.
Lower fidelity on exact field types than source — note that in the plan.

## Rung 3 — OpenAPI / Swagger

A spec file (`openapi.json`, `swagger.yaml`) or a `/docs`/`/openapi.json` URL. Parse `paths` for
method/path/params, `requestBody` schemas, and `responses` schemas. The response schema is the
envelope + data. Cite the spec path/URL.

## Rung 4 — User-pasted endpoint + sample (last resort)

No reachable backend. Ask the user for the endpoint(s) and a **real sample request and response**
(curl output, a screenshot of the network tab, copied JSON). Derive the types from the sample.
Mark these facts as user-provided in the plan so anything uncertain is visible.

---

## When rungs disagree or fall short

- Prefer the higher rung. If source says one thing and a stale spec says another, trust source.
- If a single fact is unavailable on every rung you can reach (e.g. the exact pagination meta),
  **do not invent it** — list it under the slice's Open questions and let the user fill it in. A
  flagged gap is recoverable; a silently-wrong type is not.
- If the contract can't be obtained **at all** for a slice, the slice file is still written, with
  `Status: blocked`, what's missing, and the unblock path. See `slice-template.md`.
