# toolkit-guide

The **front desk** of the toolkit. When you don't know which skill to reach for — you're new, or you've done some work and aren't sure what's next — this skill looks at your actual project and tells you the one right skill to run next, with a reason.

## What it does

- **Reads your project's real state** (it doesn't just recite the docs): `.claude/workspace.json`, each project's `ARCHITECTURE.md` / `MODULE_REGISTRY.md`, any `_docs/prd/PRD.md`, and any `_docs/FEATURE_PLAN_*.md`.
- **Figures out where you are** in the pipeline — nothing set up yet? existing code not onboarded? a plan written but not built? a design built but not wired to the API?
- **Recommends one next skill**, in backticks, with a one-line why — plus the couple of steps after it, so you see the short road ahead instead of the whole map.
- **Hands off. It never does the work** — no scaffolding, onboarding, planning, building, testing, or reviewing. It's the map, not the vehicle.

## How to use it

Just ask when you're unsure:

> "I've got an existing Next.js app — how do I use these skills on it?"
>
> "where do I start?"
>
> "I finished the auth plan, what now?"
>
> "what can all these skills even do?"

It inspects the project and answers with a specific next step (e.g. *"You have a bootstrapped `backend-shoply` and an approved `FEATURE_PLAN_auth.md` with no code yet → run `backend-module-builder` next"*), not a generic pointer.

## Example prompts

- "where do I start"
- "what should I do next"
- "which skill do I use for this"
- "I'm new to this toolkit, help me get started"
- "guide me through this"
- "I want to build a dashboard app" (ambiguous stage → it routes you to plan vs scaffold vs build)

## Important

- **Guidance only, never auto-chains.** It names the skill and stops — you decide when to run it.
- **Grounded in your files.** Advice reflects what's actually on disk (an existing PRD, an approved plan), so it won't tell you to bootstrap a project that's already set up.
- **Stays in sync** with `LAYOUT.md` (project resolution) and `NAMING.md` (skill taxonomy). If a skill is added or renamed, the guide reads those governance docs rather than a stale list.
- This is the in-session equivalent of this README — use the skill when you're *in* a project and want state-aware routing; read this README for the static overview.
