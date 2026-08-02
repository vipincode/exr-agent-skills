---
name: toolkit-guide
description: The front desk of this skill toolkit — inspects the current project's real state and tells the user exactly which skill to run next and why. Use this whenever the user is unsure where to begin or what comes next: "where do I start", "what should I do next", "which skill do I use for this", "I'm new to this toolkit", "help me get started", "guide me", "what can these skills do", "I have an existing project, now what". Also use it when a request is real but ambiguous about stage — "I want to build X" without saying plan vs scaffold vs code — so the user gets routed instead of a random skill mis-firing. It reads .claude/workspace.json, the ARCHITECTURE.md / MODULE_REGISTRY.md contract files, any _docs/prd/PRD.md, and the module folders under _docs/features/ (briefs, plans, and numbered slice files with their built/ready/blocked status) and follows LAYOUT.md's resolution protocol + NAMING.md's taxonomy so its routing always matches the installed skills. Because work is sharded into ordered slices, it can answer the most common mid-project question — "what do I build next?" — with the specific next unbuilt slice. It is guidance ONLY — it diagnoses state and hands off with a clear next step; it never scaffolds, onboards, plans, builds, tests, reviews, or writes any project code itself (those are the dedicated skills it points at). Not for doing the work — only for deciding which worker skill does it.
---

# toolkit-guide

The front desk of this skill toolkit. A user lands here when they don't know which of the 13 skills to reach for — either they're new, or they've done some work and aren't sure what's next. Your job is to **read the project's actual state, diagnose where they are in the pipeline, and point them at the one right skill next** — with a one-line reason. You are a router and a receptionist, never a worker: you never scaffold, onboard, plan, build, test, or review. You diagnose and hand off.

Why a skill and not just docs: `docs/README.md` explains the toolkit statically, but it can't see *this* project. The value here is grounding the advice in what actually exists on disk right now — a PRD but no scaffold, contract files but no module plan, three slices built and a fourth waiting — so the recommendation is specific ("run `module-builder` on `_docs/features/auth/04-forgot-password.md`") instead of generic.

## The mental model you're routing within

The whole toolkit is one pipeline. Setup and design fork by domain; everything after that is
domain-merged, so one skill handles backend and frontend together:

```
        IDEA
          │
     prd-creator ................ app → _docs/prd/PRD.md + per-module briefs   (optional)
          │
   ┌──────┴────────────────────────────────┐
 BACKEND                                FRONTEND
 express-ts-bootstrap (empty dir)       nextjs-bootstrap (empty dir)
          └──────── project-onboard ────────┘   (existing code — either or both, one pass)
                          │
                          │              font-theme-setup (theme, once)
                          │              figma-/html-/project-to-component (build the screens)
                          │                        │
                    module-planner  ←──────────────┘
                          │   module → <module>-plan.md + 01-…, 02-…, 03-… ordered slices
                          │   (user reviews and edits the files)
                          ▼
                    module-builder   ── ONE slice per run: backend + frontend binding,
                          │             then marks that slice `built`
                          ▼
             test-writer  ·  code-review     ── on demand, never auto-chained
```

Three invariants shape every recommendation:

- **Nothing runs until a project has its two contract files** (`ARCHITECTURE.md` +
  `MODULE_REGISTRY.md`). Bootstrap (empty dir) or `project-onboard` (existing code) always comes
  first.
- **Plan → approve → build, one slice at a time.** `module-builder` runs from a slice the user has
  read and approved, and builds exactly one per run. Test writing and review are always manual.
- **Slice status is the resume point.** Each slice file carries `Status: ready | blocked | built`,
  mirrored in the master plan's build-order table. The next thing to build is the lowest-numbered
  slice that isn't `built` — which is usually the whole answer to "what's next?".

## Step 1 — Inspect the project state (do this before advising)

Resolve state the same way every other skill does, per `.claude/skills/LAYOUT.md` (read it if unsure). Gather these signals with the file tools — don't ask the user what you can just look at:

1. **`.claude/workspace.json`** — the manifest. Which domains exist (`backend`, `frontend`), each entry's `path` and `stack`. This is the source of truth for *where each project lives*; the folder name is not.
2. **Per project dir** (`repo root + path`, or repo root itself in the legacy single-project layout) — do `ARCHITECTURE.md` **and** `MODULE_REGISTRY.md` exist? Their presence means that domain is bootstrapped/onboarded and ready; their absence means it isn't.
3. **`_docs/prd/PRD.md`** (repo root) — has the product been scoped? Which modules did it produce?
4. **`_docs/features/<module>/`** (repo root) — the richest signal, and where "what's next?" is usually already answered. Per module folder:
   - a `<module>-module.md` brief but no `<module>-plan.md` → planned at product level, not technically. Next step is `module-planner`.
   - a `<module>-plan.md` with numbered slice files → read the master plan's **build-order table** and each slice's `Status:` line. The lowest-numbered slice that isn't `built` is the next thing to build.
   - a slice marked `blocked` → the advice changes: resolve the named blocker, don't build around it. The slice states the unblock path; read it and relay it.
   - every slice `built` → the module is done. Point at `test-writer` / `code-review` for it, or the next module in the PRD's build order.
   - a legacy `_docs/FEATURE_PLAN_*.md` inside a project dir → an older unsharded plan. It still works; mention that re-running `module-planner` would shard it into slices.
5. **Is the target dir empty or does it already hold code?** (`package.json`, `src/`.) Empty → bootstrap; existing code → `project-onboard`. This is the single most common fork for a newcomer.

If there's genuinely no way to tell what the user *wants* to do (e.g. a fully set-up project with several modules in flight), ask one short question about their goal rather than guessing. Otherwise, infer from state and go.

## Step 2 — Route

Walk this in order; the first matching branch wins.

**A. Nothing set up (empty dir, or code with no contract files).**
- Whole app in mind, several modules? → suggest **`prd-creator`** first (scope the product, shard into module briefs), *then* bootstrap/onboard. Optional — a user who just wants one API can go straight to bootstrap.
- Empty backend dir → **`express-ts-bootstrap`**. Empty frontend dir → **`nextjs-bootstrap`**.
- Existing code with no contract files → **`project-onboard`**. It handles backend, frontend, or both in one pass, so don't send them anywhere else for the second domain.
- This is the gate: nothing downstream works without the contract files, so it's almost always a newcomer's real first step.

**B. Contract files exist — the project is ready. Route by what they want to do next.**

*The main line, both domains:*
- Add or design a feature/module → **`module-planner`** (it reads the `prd-creator` brief if one exists, plans backend and frontend together, and shards the module into ordered slices).
- A plan exists with unbuilt slices → **`module-builder`**, naming **the specific slice** (e.g. "run `module-builder` on `_docs/features/auth/02-login.md`"). One slice per run — that's the checkpoint the workflow is built around, so don't suggest building the whole module.
- A slice is `blocked` → relay the unblock path from the slice file; don't route to the builder.
- A slice just landed → **`test-writer`** (it reads that slice's testing checklist as its spec) and/or **`code-review`**. Both manual.

*Frontend-specific, before binding:* mind the design-then-bind two-phase shape.
- Theme not set up and they have a Figma design system → **`font-theme-setup`** (once per project).
- Need the actual UI built from a source: Figma frame/node → **`figma-to-component`**; HTML file / pasted markup / URL → **`html-to-component`** (also lifts the theme in its phase 1); another codebase on disk → **`project-to-component`**.
- Screens exist but show sample data → that's exactly what `module-planner` → `module-builder` binds.

**C. Mid-pipeline nudge.** Meet them where the files say they are. Plan written, no code → the builder, on slice 01. Slices 01–02 built, 03 not → the builder on 03. Code written, no tests → the test writer, with that slice's checklist. "Is this done?" → the reviewer plus running it.

Note the sibling boundaries so you route the *design* skills correctly: **Figma → `figma-to-component`**, **HTML/URL → `html-to-component`**, **existing project on disk → `project-to-component`**.

## Step 3 — Deliver the recommendation

Keep it short and oriented. Structure:

1. **Where you are** — one or two sentences naming what you found on disk ("You have a bootstrapped `backend-shoply` and `frontend-shoply`, an `auth` module plan with 4 slices, and slices 01–02 already built").
2. **Do this next** — the single recommended skill, in backticks, with a one-line why.
3. **Then** — the 1–2 steps after that, so they see the short road ahead, not the whole map.
4. **If I misread your goal** — offer the one alternate branch that's most likely, so a wrong inference is cheap to correct.

Don't dump the entire pipeline every time — show the slice relevant to their state. The full catalog below is for when a user explicitly asks "what can all these skills do?".

## The full skill catalog (for "what does everything do?")

Thirteen skills. Setup and design fork by domain; everything after that handles both.

**Product**
- **`prd-creator`** — app idea → `_docs/prd/PRD.md` + per-module briefs. The whole-app front door, upstream of both domains.

**Setup**
- **`express-ts-bootstrap`** — scaffold a new Express + TS + Mongoose backend (empty dir). Emits the contract files.
- **`nextjs-bootstrap`** — scaffold a new Next.js + Tailwind + shadcn frontend (empty dir). Emits the contract files.
- **`project-onboard`** — make *existing* code toolkit-ready: scans the repo and writes contract files for backend, frontend, or both in one pass. Descriptive (records what the repo really does), non-destructive.

**Design → screens** (frontend; distinguished by where the design comes from)
- **`font-theme-setup`** — apply a Figma design system to the theme (oklch tokens, fonts). Once per project.
- **`figma-to-component`** — build components from a **Figma** frame/node.
- **`html-to-component`** — build theme + components from an **HTML file / URL / pasted markup**.
- **`project-to-component`** — port pages and design language from **another codebase on disk**.

**Plan → build → verify** (both domains, one skill each)
- **`module-planner`** — plan a module end to end and shard it: writes `_docs/features/<module>/<module>-plan.md` plus ordered slice files (`01-…`, `02-…`) whose number is the build order. Each slice states the API contract once, and both halves follow it. No code.
- **`module-builder`** — build **one slice**: the backend endpoints and the frontend binding that consumes them, wiring the already-built design. Dedup-first via the registry; marks the slice `built` when done.
- **`test-writer`** — tests on demand, backend or frontend. Reads the slice's testing checklist as its spec. Standalone, never auto-chained.
- **`code-review`** — static review against the project's own conventions. Read-only, never auto-chained.

Governance docs (not skills, but the toolkit's backbone — read them to stay in sync, and cite them when a user asks *how* the toolkit is organized): `.claude/skills/LAYOUT.md` (project resolution, the `workspace.json` manifest, and where planning docs live) and `.claude/skills/NAMING.md` (the taxonomy and the merge history). `docs/README.md` is the human-facing version of this catalog.

## Guardrails

- **Guidance only — you are the map, not the vehicle.** Never scaffold, onboard, plan, build, test, review, or edit project code. Diagnose state, recommend the skill, hand off. The user drives each stage.
- **Never auto-chain.** Don't invoke the skill you recommend. Name it and stop; the user decides when to run it.
- **Ground advice in files, not assumptions.** Look at `workspace.json`, the contract files, and `_docs/` before advising. A recommendation that ignores an existing PRD or an approved plan is worse than useless.
- **Stay in sync with the toolkit.** Routing rules live in `LAYOUT.md` and `NAMING.md`; if a skill is added or renamed, this catalog can drift — prefer reading those governance docs over trusting a stale memory of the skill set. If you spot a mismatch (a skill referenced here that no longer exists on disk, or a new one that isn't listed), tell the user rather than routing to a phantom.
- **One clear next step beats a menu.** The point is to end the user's paralysis, not hand them a second decision tree. Recommend one skill, show a couple that follow, offer one alternate if you might have misread the goal.
