# project-to-component

Ports a page or screen design from **any existing codebase on disk** (a design mock, an old app, a legacy frontend — CSS Modules, styled-components, SCSS, plain CSS, a foreign Tailwind theme, even Vue) into a production-grade Next.js + Tailwind + shadcn/ui page in your project. The codebase counterpart to `figma-to-component` (source = Figma) and `html-to-component` (source = an HTML file/URL).

## What it does

- **Profiles the source once** (read-only) — styling system, design tokens, custom component catalog, route map — and saves it to `_docs/design-source/<name>.md` so porting page 2..N is cheap.
- **Lifts the theme if needed:** if your project still has the stock shadcn theme, it extracts the source's colors/fonts into your theme first (oklch, `next/font`, light + dark). Already themed → it maps source values onto your existing tokens instead.
- **Derives a translation map** — every source color/font/radius/spacing → your theme tokens; every source custom component (`Button`, `Modal`, `DataTable`, …) → shadcn/ui or your shared components. Nothing crosses raw.
- **Builds dedup-first** like its siblings: scans `MODULE_REGISTRY.md` + shared/feature trees, reuses/extends before creating, places generic pieces in `components/shared`, domain-specific ones in `features/<name>/components`, and registers new shared pieces.

## Before you run it

1. Your target project must be a scaffolded Next.js + shadcn project **with the contract files** (`ARCHITECTURE.md` + `MODULE_REGISTRY.md`). New project → `nextjs-bootstrap` first; existing project without contract files → `frontend-onboard` first.
2. Know the **path to the source project** on disk. You'll name it in the first prompt; the skill confirms it before reading and never modifies it.

## How to use it

**First port from a new source** — name the source path and the page:

> "Port /admin/dashboard from `D:\Work\old-frontend` into this project"

The skill will: profile the source → lift or map the theme → derive the translation map → build the page. Expect it to report what it reused vs created and which registry rows it added.

**Every port after that** — just name the page; the saved profile in `_docs/design-source/` supplies the rest:

> "Now port the orders page too"
> "Port /sales-rep/customers from the same source"

**Batch ports** work the same way — later pages reuse the shared components the first pages created, so the port gets faster and more consistent as it goes:

> "Migrate all the admin screens from the old app"

## What lands where

| Output | Location |
|---|---|
| Source profile + translation maps + route map | `_docs/design-source/<source-name>.md` |
| Page sections | `src/features/<name>/components/` |
| Screen assembly | `src/features/<name>/template/` |
| Route shell | `src/app/<route>/page.tsx` (thin: template import + metadata) |
| Reusable pieces (header, sidebar, cards …) | `src/components/shared/<group>/` + a `MODULE_REGISTRY.md` row |
| Theme changes (only if lifted) | `src/app/globals.css` + `layout.tsx` |

## Example prompts

- "Port /admin/dashboard from D:\Work\old-frontend into this project"
- "Copy the customers page design from our legacy app"
- "Make this route match the design-mock repo"
- "Rebuild the settings screen from ../old-app — keep our current data logic"
- "Migrate all the sales-rep screens from <project> into the new frontend"

## Important

- The source project is **never modified** — it's a read-only design reference. Its CSS files and components are translated, never copied or imported.
- Ports **design only, with typed sample data**. If the target page already exists and works, it's **restyled in place** — its data fetching/logic stays untouched, only the presentation changes. API wiring is `frontend-feature-planner` → `frontend-module-builder`.
- Never duplicates a route: an existing URL gets restyled in place, not re-created under a second route group.
- Mobile-first always — the source is usually desktop-only; headers/sidebars collapse into a hamburger + `Sheet` on small screens.
- You can review/edit the translation map in `_docs/design-source/<name>.md` between pages — later pages follow the edited map.
- Wrong skill if: the design is in Figma (`figma-to-component`), a single HTML file or live URL (`html-to-component`), or you need a project scaffolded (`nextjs-bootstrap`).
