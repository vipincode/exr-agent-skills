# Dependencies — always latest, never hand-pinned

The template `package.json` deliberately has **no dependencies**. Versions in a template go stale
within months; the scaffold instead installs every package through the PM at scaffold time, which
resolves the current release. This file is the install list, the known compatibility caps, and the
major-version gotchas that the shipped code already accounts for.

## Install (step 4 of the workflow)

Run from the project dir. Shown for pnpm; npm uses `npm i` / `npm i -D`, bun uses `bun add` /
`bun add -d`. **Every package gets an explicit `@latest`** — a bare name can silently reuse an older
version already in the tree as a transitive dependency (this put Zod 3 into a Next.js scaffold). After
installing, check `package.json` for the expected majors.

```bash
# runtime
pnpm add express@latest mongoose@latest jose@latest zod@latest pino@latest pino-http@latest \
  helmet@latest cors@latest compression@latest express-rate-limit@latest

# tooling + tests (typescript is installed separately — see the cap below)
pnpm add -D tsx@latest @types/node@<node-major> @types/express@latest @types/cors@latest \
  @types/compression@latest eslint@latest @eslint/js@latest typescript-eslint@latest globals@latest \
  husky@latest lint-staged@latest rimraf@latest pino-pretty@latest vitest@latest \
  @vitest/coverage-v8@latest supertest@latest @types/supertest@latest mongodb-memory-server@latest
```

`<node-major>` = the Node major the project targets (`.nvmrc`, default 24) — `@types/node` must
describe the runtime, not the newest Node.

### TypeScript: newest version inside typescript-eslint's peer range

typescript-eslint supports a capped TypeScript range, and the newest TypeScript is often outside
it. Resolve and install the highest compatible release, pinned with `~` so a minor bump can't
leave the range:

```bash
RANGE=$(npm view typescript-eslint peerDependencies.typescript)   # e.g. ">=4.8.4 <6.1.0"
npm view "typescript@$RANGE" version                               # last line = newest match, e.g. 6.0.3
pnpm add -D typescript@~<that-version>
```

Never write the range itself into `package.json`. When typescript-eslint widens its range, the
same commands pick up the newer compiler.

### Check engines after install

Read the PM's engine warnings. Tools raise their Node floor over time (at last verification
`lint-staged` 17 needed Node ≥ 22.22 and Vitest 5 needed ≥ 22.12). Keep `engines.node`, `.nvmrc`
and the Dockerfile base image in step with the strictest floor, and tell the user if their local
Node is below it.

## Last verified set (2026-10)

Reference only — the install commands above are the source of truth. If an installed **major**
is higher than the one listed here, read that library's migration notes (context7) before
trusting the shipped code, and update this table plus the code in the same change.

| Package | Verified major | Notes the shipped code relies on |
|---|---|---|
| express | 5 | Async handlers forward rejections — no `asyncHandler`. `req.query` is a getter, so `validate` redefines it. |
| mongoose | 9 | Pre-hooks no longer receive `next` — write `schema.pre("save", async function () {…})`. `FilterQuery` is now `QueryFilter`. `create()` takes `Partial<RawDoc>` (no generic). `doc.id` is `string`. Use `returnDocument: "after"` on find-and-update. |
| jose | 6 | ESM-first; HS256 `SignJWT`/`jwtVerify` API unchanged from 5. Verification errors carry `code` (`ERR_JWT_EXPIRED`, …) — `protect` maps any of them to 401. |
| zod | 4 | `import * as z from "zod"`, top-level `z.email()`/`z.uuid()`, `z.treeifyError()` (not `.flatten()`/`.format()`). |
| typescript | 6 (capped by typescript-eslint) | TS 6 defaults `types` to `[]` — `tsconfig.json` lists `"types": ["node"]` explicitly. `baseUrl`, `moduleResolution: node10`, `esModuleInterop: false` are removed in TS 7 — none are used. |
| typescript-eslint / eslint | 8 / 10 | Flat config with `defineConfig` from `eslint/config`; `tseslint.config()` is deprecated. |
| pino / pino-http | 10 / 11 | `import { pino } from "pino"`, `import { pinoHttp } from "pino-http"`. |
| express-rate-limit | 8 | `import { rateLimit }`; `standardHeaders: "draft-8"`; IPv6 grouped by /56 by default. |
| vitest | 5 | `test.projects` inline projects; `extends: true` to inherit root options (setupFiles arrays concatenate). |
| mongodb-memory-server | 11 | Downloads a `mongod` binary on first run (cached afterwards). |
| husky / lint-staged | 9 / 17 | `.husky/pre-commit` is one line: `lint-staged`. |

## The code map generator and TypeScript

`scripts/codemap.ts` uses the `typescript` package's JavaScript parser API (`ts.createSourceFile`).
TypeScript 7 is the native (Go) compiler; when typescript-eslint's range finally allows 7.x, confirm
the installed `typescript` package still exposes that API before upgrading, or the generator (and
the pre-commit hook) will break.

## Adding a dependency later (module-builder, ad-hoc edits)

1. Check `MODULE_REGISTRY.md` / the code — the capability may already exist.
2. Install with the PM as `@latest` (never a hand-written version): `pnpm add <pkg>@latest`.
3. Read the current docs (context7) for the installed major before writing code against it.
4. If it's a cross-cutting choice (a queue, a cache, a mailer), record it in `ARCHITECTURE.md` →
   Stack and wrap it once in `src/lib/` (registered) so modules import the wrapper, not the
   package.
