# Project Layout & Resolution Protocol

> **The companion to [`NAMING.md`](./NAMING.md).** NAMING.md answers *what each skill is called*;
> this file answers *which folder each skill operates on*. Read this before changing any skill's
> path handling.

## Why this exists

The toolkit started single-project: one repo, code at the root, `ARCHITECTURE.md` /
`MODULE_REGISTRY.md` at that same root. That breaks the moment a user wants a **monorepo** —
`.claude/` stays at the repo root (it is the anchor for the whole toolkit), but the actual
backend lives in its own subfolder, with a frontend coming later the same way.

**Subfolder naming convention:** the bootstrap skills always ask for a project name and scaffold
into `backend-<name>/` / `frontend-<name>/` (e.g. `backend-shoply/`, `frontend-shoply/`). The
name suffix is deliberate — each folder is typically pushed as its own git repo later, and
`backend-shoply` is self-describing where a bare `backend` is not. Plain `backend/` / `frontend/`
folders from older scaffolds keep working: the manifest `path` is the source of truth, never the
folder name.

So two locations must be distinguished:

- **Repo root** — where `.claude/` lives. Always the working directory. The anchor.
- **Project dir** — where a given project's code **and** its contract files
  (`ARCHITECTURE.md`, `MODULE_REGISTRY.md`, `src/`, `package.json`) live. This is
  either the repo root itself (`path: "."`) or a subfolder (`path: "backend-shoply"`).

Planning docs are the exception: they live at the **repo root** under `_docs/`, never inside a
project dir. See "Where planning docs live" below.

Every skill must resolve the **project dir** before it reads or writes anything. It must never
assume "project dir == working directory" anymore.

## The manifest — `.claude/workspace.json`

A small file at the repo root that maps **domain → folder**. It is the source of truth for
where each project lives.

```json
{
  "projects": [
    { "domain": "backend", "path": "backend-shoply", "stack": "express-ts" }
  ]
}
```

- **`domain`** — `"backend"` or `"frontend"`. The skills are domain-merged (one `module-planner`,
  one `module-builder`, …), so they resolve **whichever domains the work touches**: a fullstack
  slice resolves both entries and writes into both project dirs in one run.
- **`path`** — relative to the repo root. `"."` means the project is at the repo root.
- **`stack`** — informational (e.g. `express-ts`); helps disambiguate and document.

**Who writes it:** `express-ts-bootstrap` / `nextjs-bootstrap` (new project) and `project-onboard`
(existing code) create or update the entry for their domain — always **merging**, never clobbering
another domain's entry. **Who reads it:** every other skill, first thing.

Adding a frontend later is just a second entry — no skill needs to change:

```json
{
  "projects": [
    { "domain": "backend",  "path": "backend-shoply",  "stack": "express-ts" },
    { "domain": "frontend", "path": "frontend-shoply", "stack": "nextjs" }
  ]
}
```

## Resolution protocol (run this first, every skill)

Before reading `ARCHITECTURE.md` / `MODULE_REGISTRY.md` or writing any code/docs, resolve the
**project dir** for the skill's domain:

1. **Manifest present** (`.claude/workspace.json` exists) → find the entry whose `domain`
   matches this skill's domain prefix. **Project dir = repo root + that entry's `path`.** Read
   the contract files from there, and write `_docs/`, `src/`, etc. relative to that project dir.
   - If the manifest has multiple projects and **none** matches the skill's domain, ask the user
     which project to operate on (don't guess).
2. **No manifest, but `ARCHITECTURE.md` at the repo root** → **legacy single-project** layout.
   Project dir = repo root. This keeps every pre-existing single-project repo working with no
   migration. (Optionally, the writing skills may add a `{ "path": "." }` manifest entry on
   their next run to make it explicit, but it is not required.)
3. **Neither** → the project isn't set up yet. Route to **`project-onboard`** (existing code) or
   **`express-ts-bootstrap`** / **`nextjs-bootstrap`** (empty directory); do not invent conventions.

### What "project-dir-relative" means in practice

Once the project dir is resolved (call it `<proj>`), the familiar paths all hang off it:

| Reference in a skill | Resolves to |
|---|---|
| `ARCHITECTURE.md` | `<proj>/ARCHITECTURE.md` |
| `MODULE_REGISTRY.md` | `<proj>/MODULE_REGISTRY.md` |
| `src/lib`, `src/middleware`, `src/modules/<name>/` | `<proj>/src/...` |
| `src/features/<name>/`, `src/components/shared/` | `<proj>/src/...` |
| `src/app.ts` (router mount) | `<proj>/src/app.ts` |
| `package.json` (framework / PM detection) | `<proj>/package.json` |

When the project dir is the repo root, these are exactly the old paths — so behavior is
unchanged for single-project repos.

## Where planning docs live

**All planning docs live at the repo root under `_docs/`, never inside a project dir.**

The reason is structural: since the skills merged, a module plan covers backend *and* frontend in
one document — so it cannot sit inside `backend-shoply/` or `frontend-shoply/` without belonging to
the wrong half. Putting it at the root, next to the PRD it descends from, is the only placement that
works for a fullstack module and stays consistent for single-domain ones.

```
<repo root>/
  .claude/
    workspace.json                  ← the manifest
  _docs/
    prd/PRD.md                      ← prd-creator
    features/
      auth/
        auth-module.md              ← prd-creator's product brief
        auth-plan.md                ← module-planner's master plan
        01-register.md              ← ordered slices; the number is the build order
        02-login.md
        03-logout.md
      orders/
        ...
  backend-shoply/                   ← project dir: code + ARCHITECTURE.md + MODULE_REGISTRY.md
  frontend-shoply/                  ← project dir: code + ARCHITECTURE.md + MODULE_REGISTRY.md
```

| Doc | Written by | Location |
|---|---|---|
| `_docs/prd/PRD.md` | `prd-creator` | repo root |
| `_docs/features/<module>/<module>-module.md` | `prd-creator` | repo root |
| `_docs/features/<module>/<module>-plan.md` | `module-planner` | repo root |
| `_docs/features/<module>/NN-<slice>.md` | `module-planner` | repo root |
| `ARCHITECTURE.md`, `MODULE_REGISTRY.md` | bootstraps / `project-onboard` | **project dir** |

One folder per module holds everything about it — the product brief, the technical plan, and the
slices — so there's never a question of where a module's docs are.

### Slice status is the resume point

Each slice file carries `Status: ready | blocked | built`, and the master plan's build-order table
mirrors it. `module-builder` flips a slice to `built` and ticks the table when it finishes. That
pair is what lets work stop and resume across sessions: "the next thing to build" is always the
lowest-numbered slice that isn't `built` yet. Any skill that reads plans should trust the slice
file's status line as the source of truth.

### Legacy `_docs/FEATURE_PLAN_<name>.md`

Older projects have per-project plans at `<proj>/_docs/FEATURE_PLAN_<name>.md`. Those still read
fine — if a skill is pointed at one, work from it. There's no automatic migration: the next time
that module is planned, `module-planner` writes the new layout, and the old file can be deleted by
the user once its work has shipped.

## Multi-domain resolution

The protocol is domain-generic on purpose, which is what makes the merged skills work. A single
skill run may touch one domain or both:

- **`project-onboard`** detects every project in the repo, onboards each, and writes **one** merged
  manifest.
- **`module-planner`** resolves every domain the module spans, reads each one's contract files, and
  writes a single plan covering all of them.
- **`module-builder`** resolves the domains its slice touches, writes into each project dir, and
  updates each one's `MODULE_REGISTRY.md`.
- **`test-writer`** and **`code-review`** infer the domain from the target's path and resolve just
  that one — unless pointed at a fullstack slice, in which case they handle both.

No change to the manifest schema is needed for any of this — the same `domain → path` lookup runs
once per domain in scope. See `NAMING.md` for the matching naming convention (role-named workflow
skills, stack-named scaffolders).
