# EXR Agent Skills

Reusable agent skills for software planning, onboarding, module building, testing, and code review.

> **Team guide:** short per-skill docs with example prompts live in [`docs/`](docs/README.md) — start there.

## Skills

Thirteen skills. Setup and design fork by domain; planning, building, testing, and review each
handle both domains in one skill.

**Getting started**

- `toolkit-guide` - front desk: inspects your project and tells you which skill to run next.

**Product planning**

- `prd-creator` - turn an app idea into a PRD, then shard it into per-module briefs.

**Setup (once per project)**

- `express-ts-bootstrap` - scaffold a new Express + TypeScript + Mongoose backend (empty dir).
- `nextjs-bootstrap` - scaffold a new Next.js frontend with BFF proxy, axios, Zod, TanStack Query.
- `project-onboard` - make existing code toolkit-ready (writes the contract files) - backend,
  frontend, or both in one pass. Records what your repo actually does; never refactors it.

**Design to screens (frontend)**

- `font-theme-setup` - apply a Figma design system's tokens to the theme (globals.css + fonts).
- `figma-to-component` - build components from a Figma frame without creating duplicates.
- `html-to-component` - build theme + components from an HTML file, pasted markup, or URL.
- `project-to-component` - port a page or design language from another codebase on disk.

**Plan, build, verify (both domains)**

- `module-planner` - plan a module end to end (backend + frontend in one plan) and shard it into
  ordered, individually buildable slices.
- `module-builder` - build one slice: the endpoints plus the frontend binding that consumes them.
- `test-writer` - add tests on demand, from the slice's testing checklist when there is one.
- `code-review` - review code against your project's own conventions for bugs, security,
  duplication, a11y, and performance.

## How the workflow fits together

```
prd-creator          app     -> PRD + per-module briefs        (optional)
   |
bootstrap / project-onboard  -> ARCHITECTURE.md + MODULE_REGISTRY.md
   |
(frontend) font-theme-setup + figma-/html-/project-to-component -> the screens
   |
module-planner       module  -> <module>-plan.md + 01-, 02-, 03- ordered slices
   |                            (you review and edit the markdown)
module-builder       slice   -> code, ONE slice per run, then marks it built
   |
test-writer / code-review    -> on demand, never automatic
```

Planning docs live at the repo root, one folder per module:

```text
_docs/
  prd/PRD.md
  features/
    auth/
      auth-module.md      # product brief      (prd-creator)
      auth-plan.md        # module plan        (module-planner)
      01-register.md      # build first        (module-builder)
      02-login.md
      03-logout.md
```

The number is the build order, and each slice tracks its own `Status:` (`ready` / `blocked` /
`built`) so work stops and resumes cleanly. Each slice states its API contract **once**, which is
what keeps the frontend's types matching what the backend actually returns.

## Installation

### Claude Code

1. Clone or download this repository.
2. Copy the skill folders from `.claude/skills/` into your Claude skills directory.

On macOS or Linux:

```sh
mkdir -p ~/.claude/skills
cp -R .claude/skills/* ~/.claude/skills/
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
Copy-Item -Recurse -Force ".claude\skills\*" "$HOME\.claude\skills\"
```

3. Restart Claude Code so it reloads the available skills.
4. Ask Claude to use one of the skills by describing the task, for example:

```text
Review this pull request using the code-review skill.
```

### OpenAI Codex CLI

1. Clone or download this repository.
2. Copy the skill folders into your Codex skills directory.

On macOS or Linux:

```sh
mkdir -p ~/.codex/skills
cp -R .claude/skills/* ~/.codex/skills/
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills"
Copy-Item -Recurse -Force ".claude\skills\*" "$HOME\.codex\skills\"
```

3. Restart Codex so it reloads the available skills.
4. Ask Codex for a task that matches one of the skill descriptions.

## Publishing To SkillsMP

SkillsMP indexes public GitHub repositories that contain `SKILL.md` files. To make these skills discoverable:

1. Push this repository to GitHub.
2. Make the repository public.
3. Keep each skill in its own folder with a `SKILL.md` file.
4. Wait for SkillsMP's next indexing run.
5. Search SkillsMP for the repository name, GitHub username, or skill names.

## Repository Layout

```text
.claude/
  workspace.json          # maps each project's domain -> folder; see LAYOUT.md
  skills/
    NAMING.md             # skill naming & domain taxonomy, plus the merge history
    LAYOUT.md             # project-location manifest, resolution protocol, doc locations
    toolkit-guide/
    prd-creator/
    express-ts-bootstrap/
    nextjs-bootstrap/
    project-onboard/
    font-theme-setup/
    figma-to-component/
    html-to-component/
    project-to-component/
    module-planner/
    module-builder/
    test-writer/
    code-review/
```

Each skill folder holds a `SKILL.md` plus optional `references/`, `assets/`, and `scripts/`.

## Notes

- Review each `SKILL.md` before installing it in another environment.
- Keep supporting files such as `references/` together with the skill folder.
- If a skill does not appear after installation, restart the assistant CLI or app.
