# Using context7 for current APIs

This stack moves fast, and the bundled boilerplate is a **snapshot**. Before generating new code (and
especially before debugging a build error), confirm current APIs with context7. If context7 disagrees
with a bundled file, **follow context7** and update the file.

## When to query

- Workflow step 2 (always, briefly), and any time a CLI flag, import path, or API shape doesn't match
  what the bundled files assume.

## What to query (library → topics)

| Library | Topics that matter here |
| --- | --- |
| **Next.js** | App Router, `create-next-app` flags, Route Handlers (`app/api/.../route.ts`), **`proxy.ts`** (Next 16+ renamed `middleware.ts`→`proxy.ts`, `middleware`→`proxy`) + `matcher`, async `cookies()`/`headers()`, `NextResponse.redirect` |
| **shadcn/ui** | `init` + `add` CLI usage (now interactive: a component-library *base* radix/base + a *preset*; drive non-interactively with `-t next -b radix -p nova`), `components.json`, which registry items exist, Tailwind v4 setup, the `Field` primitive API (`Field`/`FieldLabel`/`FieldDescription`/`FieldError` — replaced the old RHF-bound `Form`) |
| **Tailwind CSS** | v4 CSS-first config (`@import "tailwindcss"`, `@theme`), how shadcn wires tokens |
| **TanStack Query** | v5 `QueryClient` defaults, `useQuery`/`useMutation` signatures, `QueryClientProvider`, devtools package name |
| **React Hook Form** | `useForm`, `Controller`, `useFormContext`, resolver usage |
| **@hookform/resolvers** | `zodResolver` import path and Zod v4 compatibility |
| **Zod** | v4 import style (`import * as z from "zod"`), top-level formats (`z.email()`), `z.treeifyError()` |
| **T3 Env** | `@t3-oss/env-nextjs` `createEnv` shape — `server`/`client` schemas, `experimental__runtimeEnv`, `emptyStringAsUndefined`, Zod v4 compatibility (https://env.t3.gg) |
| **axios** | instance config, request/response interceptors |

## How to use the result

- If context7 isn't reachable, generate against the bundled snapshot (current stable as of authoring)
  and **say so** in your summary to the user, so they know to sanity-check fast-moving bits.
- Prefer the CLIs' own latest output (`create-next-app@latest`, `shadcn@latest`) over hand-written
  config — they encode the current conventions. Our overlay only adds files the CLIs don't generate.
- Pin nothing from memory. Install latest; let the lockfile record versions.
