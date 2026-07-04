# Reading the source project

How to understand a design-source codebase you've never seen — enough to port its pages faithfully — and how to persist that understanding so the next page is cheap. The source is **read-only** throughout: never edit, build, or install in it.

## 1. Detect the stack and styling system

Read the source's `package.json` (framework, UI/styling deps) and glance at its tree. What you're really after is **where the visual truth lives**, which differs by styling system:

| Styling system | Detect by | Where the design lives |
|---|---|---|
| CSS Modules | `*.module.css` next to pages/components | The `.module.css` files — grid columns, gaps, spacing, radii are here, NOT in the JSX. Always read the sibling module with the page. |
| Plain CSS / SCSS | `styles/` folder, `<link>`/imports of `.css`/`.scss` | Global stylesheets + per-page files; follow `@import` chains. SCSS variables/mixins often hold the token scale. |
| styled-components / emotion | `styled.` / `css\`\`` in deps and code | The styled definitions (often in the component file or a `styles.ts`); the theme object (`ThemeProvider`) holds the tokens. |
| Tailwind (foreign theme) | `tailwind.config.*`, utility classes in markup | The config's `theme`/`extend` + `globals.css` `@theme` — its token names will NOT match the target's; map values, not names. |
| CSS variables | `:root { --* }` in a global stylesheet | The variable block is a ready-made token inventory. |
| Vue / Svelte / other frameworks | `.vue`/`.svelte` files | `<style>` blocks in the SFCs + global stylesheets. Markup structure translates the same way; ignore the framework's logic. |

Mixed systems are common (a Tailwind app with a few `.module.css` stragglers) — note all of them.

## 2. Find the token sources

In priority order, look for:

1. **Design-system docs** — `design-tokens.md`, `DESIGN.md`, a `design-artifacts/`/`docs/` folder, Storybook. When the source ships its own design guide, it beats reverse-engineering: read it once and cite it in the profile.
2. **Machine-readable tokens** — `*.tokens.json`, `design-blueprint.json`, a `theme.ts`/`tokens.ts` object.
3. **The global stylesheet / theme config** — `:root` variable blocks, SCSS variable files, `tailwind.config` theme.
4. **Frequency analysis as fallback** — run `html-to-component`'s `scripts/extract_tokens.py` over the source's main CSS files for a frequency-sorted inventory of colors/fonts/radii/shadows. Recurring values are tokens; one-offs belong to a component.

## 3. Catalog the custom UI components

List the source's own primitives (`src/components/ui/`, `src/components/`, a `ui/` lib): Button, Card, Badge, Modal, Table, Input, … with their variant props. These are **never ported** — each gets a row in the translation map's component table (→ shadcn/ui or a target shared component). Skim one or two implementations only as far as needed to understand their variants and roles; you're mapping behavior/appearance, not code.

Also note the **layout shells**: the source's header/sidebar/footer and which pages share them — those are the strongest candidates for target `components/shared/` pieces (or for reusing ones the target already has).

## 4. Locate a route's files

- Next.js-style source: `src/app/<route>/page.tsx` (or `pages/<route>.tsx`) + sibling styles.
- SPA routers: find the router config (`routes.tsx`, `App.tsx` `<Route>` table) and follow the element to its component file.
- Vue: `router/index` → view component.
- If the requested route doesn't exist in the source, list the nearest matches from the routes you've discovered and ask which screen the user means — don't guess between siblings.

Read the page's **full styling closure**: the page file, its style siblings, the custom components it renders (and *their* styles), and any layout/shell it sits in. A port that skips the shell reproduces the content but not the screen.

## 5. Write the source profile — `<proj>/_docs/design-source/<source-name>.md`

Persist what you learned so subsequent pages (and future sessions) skip the exploration. Suggested shape:

```markdown
# Design source: <source-name>
- **Root:** <absolute path>            (read-only)
- **Stack / styling:** e.g. Next.js 14 + CSS Modules + hex CSS variables (3 themes)
- **Token sources:** paths to the design docs / token files / global css found above
- **Layout shells:** header/sidebar/footer files + which routes share them

## Token inventory
(the recurring colors/fonts/radii/shadows/spacing found, with source names/values)

## Component catalog
(source component → role/variants, one line each)

## Translation maps
(appended by translation-map.md — colors, typography, scale, components)

## Route map
| target route | source file(s) | status |
|---|---|---|
| /admin/dashboard | src/app/admin/page.tsx (+ admin.module.css) | ported 2026-07-04 |
```

Update the route map every time a page is ported — the profile doubles as the port's progress tracker. If the profile exists but the source has visibly changed (paths missing, tokens moved), refresh the stale sections rather than trusting it blindly.
