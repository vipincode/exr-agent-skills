---
name: project-to-component
description: Port a page, screen, or design language from ANY existing codebase into a production-grade Next.js + TypeScript + Tailwind + shadcn/ui page in the current project — the source being another repo/folder on disk (a static design mock, an old app, a legacy frontend — CSS Modules, styled-components, SCSS, plain CSS, Vue, older React/Next, or a Tailwind app with different conventions). Use this whenever the user points at an existing project as the design source — "copy the dashboard from <path/repo>", "port /admin/orders from our old app", "make this route match <project>", "rebuild this screen from <codebase>", "migrate these pages into the new frontend", "make our page look like project X". It reads the source READ-ONLY, derives a reusable translation map (source colors/fonts/spacing → the target's oklch theme tokens; source custom UI → shadcn/ui + shared components), lifts the source theme first when the target still has the stock shadcn theme, then builds dedup-first — scanning ARCHITECTURE.md + MODULE_REGISTRY.md and the shared/feature trees, reusing/extending before creating, placing generic pieces in components/shared and domain-specific ones in features/<name>/components, and registering new shared pieces. It is the codebase counterpart to figma-to-component (source = Figma) and html-to-component (source = a single HTML file/URL) — reach for those when the source isn't a project. Builds INTO an existing Next.js + shadcn project with the contract files; it does NOT scaffold (nextjs-bootstrap) and does NOT bind APIs (frontend-module-builder).
---

# project-to-component

Reproduce a screen that exists in **another codebase** as a production page in the **target Next.js + Tailwind + shadcn/ui project** — porting the *design*, not the code. The source project (a design mock, a legacy app, someone else's frontend) is a **layout / structure / spacing / visual reference only**: its styling system, custom UI components, and framework idioms stay behind. Everything is re-created with the target's design system — oklch theme tokens, shadcn/ui primitives, the shared component library, and the project's conventions.

This is the third member of the design-to-code family. `figma-to-component` reads Figma, `html-to-component` reads an HTML file/URL, this one reads a **project**. All three follow the same rules downstream: contract files first, dedup-first building, one home per component, tokens not raw values.

## The three problems this skill solves

1. **Foreign styling doesn't transplant.** The source styles with CSS Modules, styled-components, SCSS, hex CSS variables, or a different Tailwind theme. Copying any of that across (a `.module.css`, a hex value, a `var(--color-accent)`) produces a page that ignores the target's theme and dies at the next redesign. The fix: derive a **translation map** once per source project — every recurring source value mapped to a target token, every source custom component mapped to a shadcn/shared equivalent — and route every pixel through it.
2. **Designs repeat, ports duplicate.** The same header/sidebar/card appears on every source page. A naive page-by-page port re-emits them inline and the target fills with duplicates. The fix is the family's **dedup protocol**: check `MODULE_REGISTRY.md` and the shared/feature trees before creating anything; reuse → extend → create, and register what's new — so page 2 of the port reuses what page 1 created.
3. **Source pages carry logic.** A real app's page mixes design with data fetching, auth, state. This skill ports the **design only** — sample data, typed props — unless the target page already exists and is functional, in which case its data/logic is kept and only the presentation is restyled. API binding is `frontend-feature-planner` → `frontend-module-builder`'s job, never this skill's.

## Prerequisites & resolution

1. **Resolve the target project dir** for the `frontend` domain via `../LAYOUT.md` (read `.claude/workspace.json`; fall back per the protocol). Everything below — contract files, `_docs/`, `src/`, the registry — is relative to that dir (`<proj>`). No scaffolded Next.js + shadcn project → stop and point at `nextjs-bootstrap`.
2. **Read the contract files** (required): `ARCHITECTURE.md` (conventions) and `MODULE_REGISTRY.md` (the dedup ledger). You cannot dedup against a ledger you haven't read.
3. **Resolve the source project.** Check `<proj>/_docs/design-source/` for a saved source profile from an earlier run — if one matches, reuse it and skip the profiling step. Otherwise the user must name a path (or a folder you can locate); confirm it before reading. The source is **read-only** — never edit, build, or install anything in it.
4. **Determine the target's package manager** (lockfile) for shadcn/build commands.

## Workflow

> Steps 1–3 run **once per source project** and persist their output; steps 4–8 run per page.

### 1. Profile the source project (once per source)

Read `references/reading-source.md`. Detect the source's framework and styling system, find where its design tokens live (theme/global CSS, tailwind config, design-system docs, token JSON), and catalog its custom UI components (its `Button`, `Card`, `Modal`, …). Write the findings to `<proj>/_docs/design-source/<source-name>.md` — source root, styling system, token inventory, component catalog, and the route → source-file map as you discover it. This profile is what makes page 2..N of a port cheap: later runs read it instead of re-exploring the source.

### 2. Theme gate

- **Target still has the stock shadcn theme** (default oklch values, default fonts) → **lift the source's theme first** so the port has real tokens to land on. Run the same process as `html-to-component` Phase 1, reusing its machinery directly — `../html-to-component/references/theme-tokens.md`, `../html-to-component/references/fonts.md`, and its scripts (`extract_tokens.py` works on the source's CSS files; `hex_to_oklch.py` converts every color). Produce light AND dark, wire fonts via `next/font`, and note the theming in the contract files.
- **Target is already themed** → do not touch the theme. Map source values onto the *existing* tokens (step 3). If the source uses a color/font the target theme genuinely lacks, add it as a token (never hardcode) and tell the user.

### 3. Build the translation map (once per source)

Read `references/translation-map.md` and derive the four maps for THIS source→target pair: colors → token classes, typography → font/size classes, radius/shadow/spacing → scale steps, and source custom components → shadcn/ui + shared equivalents. Append the maps to the source profile in `_docs/design-source/` so every subsequent page uses the same translations. **Never carry a raw value or source component across without a map entry.**

### 4. Read the requested page (read-only)

Locate the route in the source (profile's route map, else the source's router/pages tree). Read the page file **and everything that styles it** — sibling `.module.css`/SCSS, styled-component definitions, the custom components it renders. In most styling systems the real structure (grid columns, gaps, hierarchy) lives next to the markup, not in it. List what the page is made of before writing anything.

### 5. Decompose & dedup (the family rules)

Classify each piece reusable-generic vs feature-specific with `../html-to-component/references/shared-taxonomy.md`, then run the dedup protocol from `../html-to-component/references/dedup-protocol.md` for **every** candidate — components AND non-component reusables (utils, hooks, types, constants): check `MODULE_REGISTRY.md` → grep `components/shared`, `components/ui`, `features/*/components`, `lib`, `hooks` → **reuse / extend / create**. Source repetition is a strong hint: a component used on many source pages is almost certainly a `components/shared/` piece in the target. Fill primitive gaps with `<pm> dlx shadcn@latest add <name>` — never hand-port the source's primitive.

### 6. Build — mobile-first, token-based

Follow `../html-to-component/references/building-components.md`. The port-specific rules on top:

- Every source value goes through the translation map: source CSS grid/flex → Tailwind utilities (mobile-first, `md:`/`lg:` up); source colors/radii/shadows → token classes; source custom components → their mapped shadcn/shared equivalent. **No `.css`/`.module.css`/`.scss` files, no inline styles, no raw hex, ever.**
- Source forms (vanilla `useState`, uncontrolled inputs, other form libs) → `useForm` + `zodResolver` + the project's shared form-field components (per `ARCHITECTURE.md` / the registry).
- Icons via the project's icon registry (`components/shared/icons.tsx` — map source icon fonts/inline SVGs/emoji to lucide equivalents); images copied into `public/` + `next/image` — never referenced from the source folder.
- Animation: translate source CSS transitions/keyframes per `../html-to-component/references/animation.md`.
- Data: hardcoded typed sample data shaped like the source's content. Do not port the source's fetching/state logic.

### 7. Place the page (App Router)

- Sections → `features/<name>/components/`; screen assembly → `features/<name>/template/`; `app/<route>/page.tsx` stays a thin shell (template import + metadata).
- **URL-collision guard:** if the target route already exists, do NOT create a duplicate route or a second route group — **restyle the existing page in place**: keep its data fetching/logic/bindings, swap only the presentation. Check `src/app/` before creating anything.
- A new role/area gets its own route group with a `layout.tsx` owning that area's shell (header/sidebar); gated internal areas (admin, portal) set `robots: { index: false, follow: false }` once in the group layout.

### 8. Register & verify

Register every new shared piece in `MODULE_REGISTRY.md` (an unregistered shared component is a future duplicate — and kills the multi-page port economy this skill depends on). Update the source profile's route map with what was ported. Run `<pm> run build`; fix what fails. Report: theme lifted or mapped, translation-map entries added, components created vs **reused (with paths)**, primitives added, registry rows added, pages placed/restyled.

## What to read when

- `references/reading-source.md` — detecting the source's stack/styling system, finding its tokens and component catalog, writing the source profile, locating a route's files. Read at step 1 (and step 4 for an unprofiled route).
- `references/translation-map.md` — how to derive and persist the color/typography/scale/component maps for a source→target pair, with the standard shadcn role targets. Read at step 3.
- `../html-to-component/references/theme-tokens.md` + `fonts.md` + `scripts/` — the theme-lift machinery (step 2, only when the target is unthemed).
- `../html-to-component/references/dedup-protocol.md` — reuse/extend/create + search order. **Read before creating anything.** (step 5)
- `../html-to-component/references/shared-taxonomy.md` — shared vs feature placement. (step 5)
- `../html-to-component/references/building-components.md` — token styling, `cva`, server/client, props, assets, icons, a11y. (step 6)
- `../html-to-component/references/animation.md` — only if the source animates. (step 6)

## Non-negotiables (why this skill exists)

- **The source is read-only reference.** Never edit, build, or install in it; never import from it; never copy its files (styles, components, assets are *re-created or converted*, not linked).
- **Nothing crosses without a map.** No source hex/`var(--*)`/px, no `.module.css`/styled-components, no ported custom UI component. Every value → token class, every source component → shadcn/shared equivalent, via the persisted translation map.
- **Dedup-first, registry always.** The ledger check + tree grep runs per candidate; new shared pieces get registered immediately. On a multi-page port this is the whole economy: page N must reuse what page 1 created.
- **One home per component.** Generic → `components/shared/<group>/`; domain-specific → `features/<name>/components/`; utils/hooks → `lib`/`hooks`; multi-feature types/constants → `src/types/`/`src/constants/`. `components/ui/` is shadcn-only.
- **Design only, sample data.** Port presentation with typed sample props; leave fetching/state to the binding skills. When restyling an existing functional page, keep its logic untouched.
- **Mobile-first, real mobile nav.** The source is usually desktop-pinned; author base-small, layer `md:`/`lg:` up; headers/sidebars collapse into a hamburger + shadcn `Sheet`.
- **Restyle in place on URL collision.** Never a duplicate route or a second route group for an existing path.
- **Stay in your lane.** Figma source → `figma-to-component`; single HTML file/URL → `html-to-component`; scaffolding → `nextjs-bootstrap`; API binding → `frontend-feature-planner`/`frontend-module-builder`; tests → `frontend-test-writer`.
