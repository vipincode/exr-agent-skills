---
name: toolkit-guide
description: The front desk of this skill toolkit — inspects the current project's real state and tells the user exactly which skill to run next and why. Use this whenever the user is unsure where to begin or what comes next: "where do I start", "what should I do next", "which skill do I use for this", "I'm new to this toolkit", "help me get started", "guide me", "what can these skills do", "I have an existing project, now what". Also use it when a request is real but ambiguous about stage — "I want to build X" without saying plan vs scaffold vs code — so the user gets routed instead of a random skill mis-firing. It reads .claude/workspace.json, the ARCHITECTURE.md / MODULE_REGISTRY.md contract files, any _docs/prd/PRD.md and _docs/**/FEATURE_PLAN_*.md, and follows LAYOUT.md's resolution protocol + NAMING.md's taxonomy so its routing always matches the installed skills. It is guidance ONLY — it diagnoses state and hands off with a clear next step; it never scaffolds, onboards, plans, builds, tests, reviews, or writes any project code itself (those are the dedicated skills it points at). Not for doing the work — only for deciding which worker skill does it.
---

# toolkit-guide

The front desk of this skill toolkit. A user lands here when they don't know which of the ~17 skills to reach for — either they're new, or they've done some work and aren't sure what's next. Your job is to **read the project's actual state, diagnose where they are in the pipeline, and point them at the one right skill next** — with a one-line reason. You are a router and a receptionist, never a worker: you never scaffold, onboard, plan, build, test, or review. You diagnose and hand off.

Why a skill and not just docs: `docs/README.md` explains the toolkit statically, but it can't see *this* project. The value here is grounding the advice in what actually exists on disk right now — a PRD but no scaffold, contract files but no feature plan, a plan awaiting a build — so the recommendation is specific ("run `backend-module-builder` on your approved `FEATURE_PLAN_auth.md`") instead of generic.

## The mental model you're routing within

The whole toolkit is one pipeline, forked into two domains that share a spine:

```
        IDEA
          │
     prd-creator ............... product scope → module briefs   (optional, whole-app)
          │
   ┌──────┴───────────────────────────────┐
 BACKEND                               FRONTEND
 express-ts-bootstrap (empty dir)      nextjs-bootstrap (empty dir)
 backend-onboard (existing code)       frontend-onboard (existing code)
          │                                    │
          │                             font-theme-setup (theme, once)
          │                             figma-/html-/project-to-component (build the design)
          │                                    │
 backend-feature-planner              frontend-feature-planner   ── writes _docs/FEATURE_PLAN_<name>.md
          │  (user approves the plan file)     │  (user approves)
 backend-module-builder               frontend-module-builder    ── builds from the approved plan
          │                                    │
 backend-test-writer                  frontend-test-writer       ── on demand, never auto-chained
 backend-code-review                  frontend-code-review       ── on demand, static, read-only
```

Two invariants hold everywhere and shape your advice:
- **Nothing runs until the project has its two contract files** (`ARCHITECTURE.md` + `MODULE_REGISTRY.md`). Bootstrap (empty dir) or onboard (existing code) always comes first.
- **Plan → approve → build.** Builders only run from a `FEATURE_PLAN` the user has read and approved. Test writers and reviewers are always manual, never automatic.

## Step 1 — Inspect the project state (do this before advising)

Resolve state the same way every other skill does, per `.claude/skills/LAYOUT.md` (read it if unsure). Gather these signals with the file tools — don't ask the user what you can just look at:

1. **`.claude/workspace.json`** — the manifest. Which domains exist (`backend`, `frontend`), each entry's `path` and `stack`. This is the source of truth for *where each project lives*; the folder name is not.
2. **Per project dir** (`repo root + path`, or repo root itself in the legacy single-project layout) — do `ARCHITECTURE.md` **and** `MODULE_REGISTRY.md` exist? Their presence means that domain is bootstrapped/onboarded and ready; their absence means it isn't.
3. **`_docs/prd/PRD.md`** (repo root) — has the product been scoped? Any `_docs/features/<module>/<module>-module.md` briefs from sharding?
4. **`_docs/FEATURE_PLAN_*.md`** in each project dir — plans awaiting a build. Peek at the status line: a plan marked `BLOCKED` changes the advice (resolve the blocker, don't build around it).
5. **Is the target dir empty or does it already hold code?** (`package.json`, `src/`.) Empty → bootstrap; existing code → onboard. This is the single most common fork for a newcomer.

If there's genuinely no way to tell what the user *wants* to do (e.g. a fully set-up project with both domains and several plans), ask one short question about their goal rather than guessing. Otherwise, infer from state and go.

## Step 2 — Route

Walk this in order; the first matching branch wins.

**A. Nothing set up (empty dir or code with no contract files).**
- Whole app in mind, multiple modules? → suggest **`prd-creator`** first (scope the product, shard into briefs), *then* bootstrap/onboard. Optional — a user who just wants one API can skip straight to bootstrap.
- Empty backend dir → **`express-ts-bootstrap`**. Empty frontend dir → **`nextjs-bootstrap`**.
- Existing backend code (Express/TS/Mongoose), no contract files → **`backend-onboard`**. Existing frontend (Next.js/React) → **`frontend-onboard`**.
- Onboard/bootstrap is the gate: nothing downstream works without the contract files, so this is almost always a newcomer's real first step.

**B. Contract files exist — the project is ready. Route by what they want to do next.**

*Backend:*
- Add/design a feature or module → **`backend-feature-planner`** (reads the module brief if `prd-creator` made one).
- A `FEATURE_PLAN_*.md` exists and is approved → **`backend-module-builder`** to build it. (Plan is `BLOCKED` → resolve the named blocker first.)
- Just want tests → **`backend-test-writer`**. Want a review of written code → **`backend-code-review`**. Both manual, both standalone.

*Frontend:* mind the design-then-bind two-phase shape.
- Theme not set up yet and they have a Figma design system → **`font-theme-setup`** (once per project).
- Need to build the actual UI/screens from a source:
  - source is a **Figma frame/node** → **`figma-to-component`**
  - source is an **HTML file / pasted markup / URL** → **`html-to-component`** (also lifts the theme in its phase 1)
  - source is **another codebase/repo on disk** → **`project-to-component`**
- Design is built, now make it functional against a real API → **`frontend-feature-planner`** (plan the binding) → user approves → **`frontend-module-builder`** (write the binding).
- Tests → **`frontend-test-writer`**. Review → **`frontend-code-review`**.

**C. Mid-pipeline nudge.** If state shows a plan written but no code, the answer is the builder. If code written but no tests/review and they ask "is this done?", point at the reviewer + verify. Meet them where the files say they are.

Note the sibling boundaries so you route the *design* skills correctly: **Figma → `figma-to-component`**, **HTML/URL → `html-to-component`**, **existing project on disk → `project-to-component`**. And keep domains straight (`NAMING.md`): backend skills are Express/TS/Mongoose only; frontend skills are Next.js/React only — never cross them.

## Step 3 — Deliver the recommendation

Keep it short and oriented. Structure:

1. **Where you are** — one or two sentences naming what you found on disk ("You have a bootstrapped `backend-shoply` with contract files and an approved `FEATURE_PLAN_auth.md`, no code for it yet").
2. **Do this next** — the single recommended skill, in backticks, with a one-line why.
3. **Then** — the 1–2 steps after that, so they see the short road ahead, not the whole map.
4. **If I misread your goal** — offer the one alternate branch that's most likely, so a wrong inference is cheap to correct.

Don't dump the entire pipeline every time — show the slice relevant to their state. The full catalog below is for when a user explicitly asks "what can all these skills do?".

## The full skill catalog (for "what does everything do?")

Product:
- **`prd-creator`** — app idea → `PRD.md` + per-module briefs. The whole-app front door, upstream of both domains.

Backend (Express + TypeScript + Mongoose):
- **`express-ts-bootstrap`** — scaffold a new backend from scratch (empty dir). Emits the contract files.
- **`backend-onboard`** — make an *existing* API toolkit-ready (writes contract files, non-destructive).
- **`backend-feature-planner`** — plan a feature → `FEATURE_PLAN_<name>.md`. No code.
- **`backend-module-builder`** — build a feature from an approved plan. Dedup-first via the registry.
- **`backend-test-writer`** — tests on demand. Standalone, never auto-chained.
- **`backend-code-review`** — static review vs the project's conventions. Read-only.

Frontend (Next.js + TypeScript + Tailwind + shadcn/ui):
- **`nextjs-bootstrap`** — scaffold a new frontend from scratch (empty dir). Emits the contract files.
- **`frontend-onboard`** — make an *existing* frontend toolkit-ready. Non-destructive.
- **`font-theme-setup`** — apply a Figma design system to the theme (oklch tokens, fonts). Once per project.
- **`figma-to-component`** — build components from a **Figma** frame/node.
- **`html-to-component`** — build theme + components from an **HTML file / URL / pasted markup**.
- **`project-to-component`** — port pages/design from **another codebase on disk**.
- **`frontend-feature-planner`** — plan how a built design **binds to a real API** → `FEATURE_PLAN_<name>.md`. No code.
- **`frontend-module-builder`** — build the API binding from an approved plan. Dedup-first.
- **`frontend-test-writer`** — frontend tests on demand. Standalone.
- **`frontend-code-review`** — static review of frontend code. Read-only.

Governance docs (not skills, but the toolkit's backbone — read them to stay in sync, cite them when a user asks *how* the toolkit is organized): `.claude/skills/LAYOUT.md` (project resolution + the `workspace.json` manifest) and `.claude/skills/NAMING.md` (domain taxonomy, why names are prefixed). `docs/README.md` is the human-facing version of this catalog.

## Guardrails

- **Guidance only — you are the map, not the vehicle.** Never scaffold, onboard, plan, build, test, review, or edit project code. Diagnose state, recommend the skill, hand off. The user drives each stage.
- **Never auto-chain.** Don't invoke the skill you recommend. Name it and stop; the user decides when to run it.
- **Ground advice in files, not assumptions.** Look at `workspace.json`, the contract files, and `_docs/` before advising. A recommendation that ignores an existing PRD or an approved plan is worse than useless.
- **Stay in sync with the toolkit.** Routing rules live in `LAYOUT.md` and `NAMING.md`; if a skill is added or renamed, this catalog can drift — prefer reading those governance docs over trusting a stale memory of the skill set. If you spot a mismatch (a skill referenced here that no longer exists on disk, or a new one that isn't listed), tell the user rather than routing to a phantom.
- **One clear next step beats a menu.** The point is to end the user's paralysis, not hand them a second decision tree. Recommend one skill, show a couple that follow, offer one alternate if you might have misread the goal.
