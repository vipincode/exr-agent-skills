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
  (`ARCHITECTURE.md`, `MODULE_REGISTRY.md`, `src/`, `_docs/`, `package.json`) live. This is
  either the repo root itself (`path: "."`) or a subfolder (`path: "backend-shoply"`).

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

- **`domain`** — matches the skill's domain prefix. `backend-*` skills resolve the `"backend"`
  entry; future `frontend-*` skills resolve the `"frontend"` entry.
- **`path`** — relative to the repo root. `"."` means the project is at the repo root.
- **`stack`** — informational (e.g. `express-ts`); helps disambiguate and document.

**Who writes it:** `express-ts-bootstrap` (new project) and `backend-onboard` (existing project)
create or update the entry for their domain. **Who reads it:** every other skill, first thing.

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
3. **Neither** → the project isn't set up yet. Route to **`backend-onboard`** (existing code) or
   **`express-ts-bootstrap`** (empty directory); do not invent conventions.

### What "project-dir-relative" means in practice

Once the project dir is resolved (call it `<proj>`), the familiar paths all hang off it:

| Reference in a skill | Resolves to |
|---|---|
| `ARCHITECTURE.md` | `<proj>/ARCHITECTURE.md` |
| `MODULE_REGISTRY.md` | `<proj>/MODULE_REGISTRY.md` |
| `_docs/FEATURE_PLAN_<name>.md` | `<proj>/_docs/FEATURE_PLAN_<name>.md` |
| `src/lib`, `src/middleware`, `src/modules/<name>/` | `<proj>/src/...` |
| `src/app.ts` (router mount) | `<proj>/src/app.ts` |
| `package.json` (framework / PM detection) | `<proj>/package.json` |

When the project dir is the repo root, these are exactly the old paths — so behavior is
unchanged for single-project repos.

## Scaling to frontend

This protocol is domain-generic on purpose. When the first frontend skills ship
(`frontend-onboard`, `frontend-feature-planner`, …), they:
- resolve the `"frontend"` manifest entry by the same protocol, and
- write their own `{ "domain": "frontend", "path": "frontend" }` entry on bootstrap/onboard.

No change to the manifest schema or the resolution steps is needed — only a new domain value.
See `NAMING.md` for the matching naming convention (domain-prefixed workflow skills,
stack-named scaffolders).
