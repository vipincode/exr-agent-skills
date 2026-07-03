---
name: html-to-component
description: Turn an HTML file, a pasted HTML section, or a live URL into a production-grade Next.js + TypeScript + Tailwind + shadcn/ui design — in two phases. (1) THEME — extract the design's tokens (colors → oklch, typography, fonts, radius, shadows, spacing, gradients, background images) and apply them to globals.css + wire fonts in layout.tsx. (2) COMPONENTS — turn the markup into components WITHOUT creating duplicates, scanning MODULE_REGISTRY.md and the shared/feature trees first and reusing/extending what exists, placing generic pieces (header, navbar, hero, small-hero, carousel, charts, sidebar, avatar, logo, banner …) in components/shared and domain-specific ones in features/<name>/components, styling with Tailwind utilities + theme tokens, animating with Tailwind/CSS or framer-motion, and registering new shared components. Use this whenever the user wants to convert/implement/build HTML into React/Next.js — phrases like "turn this HTML into a component", "build this html section", "convert design.html to next.js", "code this markup", "html to react/next", or when they point at an .html file (often in _docs/designs/) or paste a chunk of HTML/CSS and want components. Looks for design files in _docs/designs/ by default. Builds INTO an existing Next.js + shadcn project (scaffold first with nextjs-bootstrap; this skill does NOT scaffold). It is the HTML counterpart to figma-to-component — reach for that one when the source is Figma instead.
---

# html-to-component

Convert HTML (a whole page, a pasted section, or a fetched URL) into **Next.js + Tailwind + shadcn/ui** that looks production-grade *and* fits the project's existing structure. It does two jobs in order: first it lifts the design's **tokens into the theme** (colors in oklch, fonts, radius, shadows, spacing, gradients) so everything downstream is token-based; then it turns the **markup into components without creating duplicates** — the headline being **no duplicate `Header`, no second `Avatar`, no third `Card`**.

The hard part isn't generating JSX from HTML — current models do that well. The hard parts are: (a) not hardcoding the raw `#3B82F6`/`14px`/`box-shadow` the HTML is full of, but routing them through a real theme; and (b) not re-emitting the same header/card/avatar inline on every section. So this skill is built around a **theme-first, then dedup-first** discipline.

This is a **builder** skill. It assumes the project is already scaffolded (`nextjs-bootstrap`) — it builds *into* that structure. It does **not** scaffold.

## The two core problems this skill solves

1. **Raw values everywhere.** HTML/CSS hands you literal hex, px, rgba shadows, inline styles, or baked-in Tailwind arbitrary values (`bg-[#3B82F6]`, `text-[14px]`). Shipped as-is, the redesign never survives and shadcn components stay unthemed. The fix: extract the *recurring* values as **tokens** and write them where a shadcn app stores its theme — `globals.css` (colors in **oklch**) and `layout.tsx` (fonts) — then style components with `bg-primary`/`rounded-lg`/`shadow-card`, never the raw value.
2. **Designs repeat.** The same header sits on five sections, avatars and cards are everywhere. A naive markup→code pass re-emits each inline and the codebase fills with duplicates. The fix: treat `MODULE_REGISTRY.md` as a dedup ledger and the shared/feature trees as the source of truth — **before writing any component, check whether it already exists; reuse it, extend it, or only then create it**, and put reusable ones in `components/shared/` so the next section reuses them. Read `references/dedup-protocol.md`; it's the heart of phase 2.

## Prerequisites & resolution

1. **Resolve the project dir.** Read `.claude/workspace.json` (repo root) → `frontend` entry = `<proj>`. Else find a `frontend/` folder or a `src/app/` with shadcn (`globals.css` + `components/ui/`). If there's no scaffolded Next.js + shadcn project, stop and point at `nextjs-bootstrap` — this skill builds into an existing structure, it doesn't create one.
2. **Read the contract files** (required): `ARCHITECTURE.md` (conventions) and `MODULE_REGISTRY.md` (the dedup ledger — every existing shared component, hook, util). You cannot dedup against a ledger you haven't read.
3. **Resolve the HTML input.** In priority order: an explicit path the user gave → a pasted HTML block in the message → a URL (fetch it) → **scan `_docs/designs/`** (the project's design drop-folder) and use/confirm the relevant file. If the HTML links external CSS (`<link rel="stylesheet">`) or fonts, read those files too — the styling lives there. See `references/reading-html.md`.
4. **Determine the package manager** (`pnpm`/`npm`/`yarn` from the lockfile) for shadcn/build commands below.

## Decide the scope (which phases to run)

- **A whole page / a fresh design, or the project still has the stock shadcn theme** → run **Phase 1 (theme)** then **Phase 2 (components)**.
- **A single section/snippet on an already-themed project** → Phase 2 is the focus, but still scan the snippet for **new tokens** (a brand color or font not yet in the theme). Don't hardcode them — append them to the theme (a light Phase 1 pass) and then reference them. Surface to the user when you add a token.
- **The user explicitly asks for only theming or only a component** → do just that phase. Stay in scope.

State which phases you'll run before you start, so the user can redirect.

---

## Phase 1 — Theme (tokens → globals.css + layout.tsx)

> Skip or trim per the scope decision above. Paths are relative to `<proj>`.

1. **Extract the tokens from the HTML.** Pull every recurring color, font-family, font-size/line-height, font-weight, radius, shadow, spacing step, gradient, and background image out of the `<style>` blocks, linked CSS, inline `style=` attributes, and any baked-in Tailwind classes. Run `scripts/extract_tokens.py <file>` to get a frequency-sorted inventory fast, then read it with judgment — **recurring** values are tokens; one-offs belong to a component, not the theme. See `references/reading-html.md` ("Extracting design tokens").
2. **Normalize into a token map.** Group into: colors (→ shadcn roles), typography (families + the size/line-height/weight scale), radius, shadows, spacing, gradients, background images. Map the design's colors onto shadcn's **semantic roles** rather than inventing names (so every shadcn component is themed for free). See `references/theme-tokens.md`.
3. **Convert every color to oklch.** Collect the values into `{role: "#hex"}` and run `python scripts/hex_to_oklch.py --json colors.json`. Use the output verbatim — shadcn/Tailwind v4 store theme colors as oklch; never paste raw hex into theme variables.
4. **Rewrite `globals.css` — light AND dark.** Update the `:root` (light), `.dark` (dark), and `@theme inline` blocks — re-value the roles, don't rename them. shadcn themes are dual-mode: if the HTML defines a dark variant (`.dark`/`[data-theme="dark"]` block, `prefers-color-scheme: dark` media query, or `dark:` Tailwind variants) capture that palette into `.dark`; if it's single-mode, fill the given mode and **derive** the other (don't leave stale shadcn defaults) and say you derived it. Set `--radius`, add `--shadow-*`, gradient tokens, and any custom type-scale entries. `references/theme-tokens.md` has the exact block shapes and the dark-derivation rules.
5. **Wire fonts in `layout.tsx`.** Google families via `next/font/google`, custom/brand files via `next/font/local` (drop files under `src/app/fonts/`). Each font exposes a CSS variable; add them to `<html className>` and bind them in `@theme` (`--font-sans`, `--font-display`, …). Never `<link>` tags or `@import url()`. See `references/fonts.md`.
6. **Apply the rest as tokens.** Radius, shadows, gradients, background images → tokens/utilities so components reference `rounded-lg`, `shadow-card`, `bg-[image:var(--gradient-brand)]`, never raw values.
7. **Update the contract files.** In `ARCHITECTURE.md`, make the theme concrete (fonts used, palette source = this HTML, oklch). In `MODULE_REGISTRY.md`, log the theming decision.

---

## Phase 2 — Components (the dedup-first build)

> Paths relative to `<proj>`. Conventions come from `ARCHITECTURE.md` + the references below; project docs win on project-specifics.

1. **Map the structure before coding.** Read the HTML top-down. Semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<aside>`) and class names (`hero`, `card`, `navbar`, `avatar`) are your **decomposition map and dedup hints** — the HTML analog of Figma layer names. List the discrete pieces. For a big page, outline the sections first, then drill into each. See `references/reading-html.md`.
2. **Classify each candidate piece** reusable-generic vs feature-specific using `references/shared-taxonomy.md`. A block that is a header/navbar/hero/carousel/chart/sidebar/avatar/logo/banner is almost always a **shared** component.
3. **Run the dedup protocol for every candidate** (`references/dedup-protocol.md`): check `MODULE_REGISTRY.md` → grep `components/shared`, `components/ui`, `features/*/components` → decide **reuse / extend / create**. Never create something the ledger already lists. If a feature-local component is now needed by a second feature, **move it to shared** (don't copy).
4. **Fill primitive gaps via shadcn, not by hand.** If a piece is really a primitive the project lacks (`carousel`, `avatar`, `chart`, `tabs`, `accordion`, `sidebar`, …), add it with `<pm> dlx shadcn@latest add <name>` into `components/ui/` and **compose** it — never hand-author or re-skin a primitive.
5. **Build each new component — mobile-first and token-based.** Tailwind utility classes only (no separate CSS files; no inline `style={{}}` for things Tailwind covers); reference **theme tokens** (`bg-primary`, `text-muted-foreground`, `rounded-lg`, `shadow-card`, `font-display`) instead of the raw hex/px in the source HTML — never a hardcoded color when a token exists. Author **mobile-first**: base classes target small screens, layer up with `md:`/`lg:` prefixes; honor the source's `@media` queries via breakpoints, and infer the mobile layout when the markup is desktop-only. Any header/navbar/sidebar **collapses on mobile into a hamburger that opens a shadcn `Sheet`**. Match spacing, gap, radius, border, shadow, line-height faithfully — through the token system, responsively (don't pin desktop px). TypeScript props; `cva` for variant-bearing components. Reusable → `components/shared/<group>/`; domain-specific → `features/<name>/components/`. See `references/building-components.md`.
6. **Assets & icons.** For `<img>`/background images in the HTML: copy local asset files into `public/` (or the feature) and use `next/image`; for remote `src` URLs, download into `public/` rather than hotlinking. **Icons come from the single registry file `components/shared/icons.tsx`** (lucide-react first, react-icons for gaps, custom `currentColor` SVGs last) — map source icon fonts/inline `<svg>`s to lucide equivalents and import from the registry, never from the icon library directly. See `references/building-components.md` ("Assets", "Icons").
7. **Animation.** Default to Tailwind/CSS transitions and shadcn's built-in motion; reach for **framer-motion** (`motion/react`) only for orchestrated/gesture/scroll-linked motion. Translate CSS `transition`/`@keyframes`/`animation` in the source to the equivalent. See `references/animation.md`.
8. **Compose & register.** Assemble the pieces into the screen via a feature `template/` if it's a full screen; keep `page.tsx` thin. **Register every new shared component** in `MODULE_REGISTRY.md` (name, path, what it wraps, purpose) — an unregistered shared component is a future duplicate.
9. **Verify.** `<pm> run build` (typecheck + lint) and a quick read-through against the source HTML. Report: theme changes (if Phase 1 ran), components created vs reused, where each landed, primitives added, registry rows added.

---

## What to read when

- `references/reading-html.md` — how to read the input (file / pasted / URL / `_docs/designs`), resolve linked CSS & fonts, parse structure for decomposition, and extract design tokens from plain CSS, inline styles, and baked-in Tailwind. Read before Phase 1 step 1 and Phase 2 step 1.
- `references/theme-tokens.md` — shadcn role table, color→role mapping, the exact Tailwind v4 `:root` / `.dark` / `@theme inline` block shapes, and radius/shadow/gradient/bg-image tokens. Read during Phase 1 steps 2–6.
- `references/fonts.md` — `next/font/google` and `next/font/local` patterns, exposing & binding CSS variables, handling the families the HTML uses. Read during Phase 1 step 5.
- `references/dedup-protocol.md` — the reuse/extend/create decision and the exact search order. **Read before creating any component.** This is the skill's reason to exist.
- `references/shared-taxonomy.md` — reusable-shared vs feature-specific, the canonical shared list (header, navbar, hero, small-hero, carousel, charts, sidebar, avatar, logo, banner …) and which `components/shared/` subfolder each lands in. Read during Phase 2 step 2.
- `references/building-components.md` — Tailwind-token styling rules, `cva`, server vs client, props/typing, faithful spacing/shadow/radius via tokens, assets/`next/image`, accessibility. Read before Phase 2 step 5.
- `references/animation.md` — Tailwind/CSS vs framer-motion decision and patterns; translating CSS animation from the source. Read before Phase 2 step 7 (only if the design animates).
- `scripts/extract_tokens.py` — scans an HTML/CSS file and prints a frequency-sorted inventory of colors, font-families, font-sizes, radii, shadows, gradients. Run it first in Phase 1.
- `scripts/hex_to_oklch.py` — hex/rgb → `oklch()` converter (single, many, or `--json` batch). Use it for every color.

## Non-negotiables (why this skill exists)

- **Colors are oklch, tokens not raw values.** Recurring colors become shadcn role tokens in `globals.css`, converted with the script. A component shipping `bg-[#3B82F6]` or `text-[14px]` when a token exists defeats the theme and the next redesign. Always use the token — translate raw HTML values to `bg-primary`/`text-sm`/`rounded-xl`/`shadow-card`, never a hardcoded color.
- **Mobile-first responsive, with a real mobile nav.** Every component is authored mobile-first (base = small screen, `md:`/`lg:` layer up), never desktop-pinned to the mockup's fixed width. Any header/navbar/sidebar **collapses on mobile into a hamburger that opens a shadcn `Sheet`** — not links silently `hidden` with no affordance.
- **Check the registry before you create — every time.** The `MODULE_REGISTRY.md` ledger + a grep of `shared`/`ui`/`features` is mandatory per candidate component. Re-creating something that exists is the exact failure this skill prevents. Reuse > extend > create.
- **One home per component, by dependency.** Generic/reusable → `components/shared/<group>/`. Depends on one feature's domain → `features/<name>/components/`. A reusable component buried in a feature folder is a bug; so is a domain component in shared. When a feature-local piece is needed by a second feature, it **moves** to shared and gets registered — never copied.
- **shadcn primitives are composed, never duplicated.** Need a carousel/avatar/chart/tabs/sidebar? `shadcn add` it and wrap it. Hand-writing a primitive shadcn ships, or forking a styled sibling of `Button`/`Select`, is a regression. When the design's primitive looks different, **edit its `cva` variants in place** (see `references/building-components.md` "The design's variants live in `ui/`") — that's the sanctioned path.
- **Don't restructure shadcn's theme — re-value it.** Keep the role names and the `:root`/`.dark`/`@theme inline` shape; swap values and add tokens. Fonts go through `next/font`, never `<link>`/`@import`.
- **Always produce both light and dark.** shadcn's theme is dual-mode. Capture the design's dark palette when it has one; derive it when it doesn't. Every role in `:root` must also exist in `.dark` — a missing role is an unthemed component in dark mode. Leaving stock shadcn dark defaults under a custom light theme is the failure to avoid.
- **Reusable shared components get registered immediately.** A new `Header`/`Avatar`/`Carousel` in `components/shared/` that isn't in `MODULE_REGISTRY.md` is invisible to the next run and will be rebuilt.
- **Faithful, but production-grade.** Honor the design's spacing, gaps, radii, borders, shadows, gradients, line-heights — through tokens, responsively (mobile-first, not desktop-pinned). Semantic markup, alt text, focus states. The output should look like a senior engineer built it, not like converted markup.
- **Stay in your lane.** Build into the existing structure. Don't scaffold (that's `nextjs-bootstrap`). When the source is Figma, use `figma-to-component` instead.
