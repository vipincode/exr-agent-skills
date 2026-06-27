# Reading HTML for code (input + tokens + structure)

The source here is markup, not a Figma file — which is in some ways *easier* (you have the
literal CSS values) and in some ways *harder* (no named variables like `color/primary/600`, no
clean asset export, styling can be scattered across `<style>`, linked CSS, inline attributes, or
baked-in Tailwind). This doc covers: getting the input, resolving where the styling lives,
reading structure for decomposition, and extracting design tokens.

## 1. Resolve the input

In priority order:

1. **Explicit path** the user gave (`design.html`, `./mock/landing.html`) → read it.
2. **Pasted HTML** in the message → use it directly. A pasted *section* (a hero, a card grid)
   is a partial; you're building that section's components, not a whole page.
3. **A URL** → fetch it (WebFetch). Caveats: you get the *server-rendered* HTML, so JS-rendered
   SPAs may come back near-empty, and auth-walled pages won't load. If the fetch is thin, say so
   and ask for the HTML file instead.
4. **`_docs/designs/`** — the project's design drop-folder and the default place to look. If the
   user didn't name a file, list what's there and confirm which design to build.

## 2. Resolve where the styling lives (read it ALL)

The markup is only half the design — the CSS is the other half. Track down every source before
you trust a value:

- **`<style>` blocks** in the document `<head>` or inline — read them.
- **Linked stylesheets** (`<link rel="stylesheet" href="...">`) — read the referenced file
  (resolve the path relative to the HTML file; for a URL, fetch it). This is where most of the
  real tokens usually live.
- **Inline `style="..."` attributes** on elements — common in exported/email HTML; parse them.
- **Baked-in Tailwind classes** (`class="bg-blue-600 text-sm rounded-xl px-4"` or arbitrary
  values `bg-[#3B82F6]`) — the classes already *encode* the design intent. Read them as the spec
  and reconcile to the project's theme tokens (don't blindly copy a foreign palette).
- **`<link>`/`@import` font references and `@font-face`** — these name the fonts to wire via
  `next/font` (see `fonts.md`); the font files (if bundled) are your `next/font/local` sources.

A real design often mixes several of these. Resolve the cascade with judgment: the value that
actually renders wins.

## 3. Read structure for decomposition (Phase 2)

Read the document top-down and let the markup tell you the components:

- **Semantic tags are candidate components.** `<header>`, `<nav>`, `<main>`, `<section>`,
  `<aside>` (sidebar), `<footer>`, `<article>` (card) each usually map to a discrete piece.
- **Class / id names are the strongest dedup hint** — the HTML analog of Figma layer names. A
  node with `class="hero"`, `class="navbar"`, `class="card"`, `class="avatar"`,
  `class="carousel"` is almost certainly that shared component (see `shared-taxonomy.md`).
- **Repetition signals a list/loop, not N components.** Five sibling `.card`s = one `Card`
  rendered over data, not five components. Three identical nav items = a `.map()`. Spotting
  repetition early is half of dedup.
- **For a big page, outline first.** List the top-level sections (header / hero / features /
  pricing / footer), then drill into each one's internals rather than trying to hold the whole
  DOM at once. Build leaf/shared pieces first, then compose upward.

Treat the source markup as a **reference for layout and values, not code to paste** — you're
harvesting structure, spacing, and colors, then re-expressing them as semantic JSX + Tailwind
tokens (see `building-components.md`). Don't ship the HTML's class soup or `<div>`-only markup.

## 4. Extracting design tokens (Phase 1)

Goal: get the design's **values** out so they become shadcn theme tokens. The repetitive part —
finding every color/font/size/radius/shadow — is what `scripts/extract_tokens.py` is for:

```bash
python scripts/extract_tokens.py _docs/designs/landing.html
# or pipe combined html+css, or point at a .css file
python scripts/extract_tokens.py path/to/styles.css --json
```

It prints a **frequency-sorted inventory** of hex/rgb/hsl colors, `font-family` declarations,
`font-size` values, `border-radius` values, `box-shadow`s, and gradients. Read the inventory
with judgment:

- **Recurring values are tokens; one-offs are component-level.** A color used 30 times across
  buttons and links is `--primary`. A single bespoke gradient on one hero is that component's
  business, not a global token. (Same scope rule as Figma: theme = the reusable foundation.)
- **Colors** → build a `{role: hex}` map (guess the shadcn role from where it's used: the main
  button/link color → `primary`; body text → `foreground`; page bg → `background`; hairlines →
  `border`). Finalize with `theme-tokens.md`, then convert with `hex_to_oklch.py`.
- **Font families** → the `--font-*` names for `layout.tsx` (`fonts.md`). Note which family is
  used for headings vs body.
- **Font sizes / line-heights** → if there's a deliberate scale (a few repeated sizes), encode it
  as type tokens; otherwise map each to the nearest Tailwind step (`text-sm`/`text-base`/…).
- **Radius / shadows / gradients** → tokens (`--radius`, `--shadow-*`, gradient vars). Keep the
  shadow offset/blur, convert the color part to oklch.

### Reading the three CSS forms for tokens

- **Plain CSS / `<style>`**: read declarations directly — `color: #1f2937`, `font-size: 14px`,
  `border-radius: 12px`, `box-shadow: 0 1px 2px rgba(0,0,0,.05)`.
- **Inline `style="..."`**: same values, scattered per element — the extractor catches these too;
  watch for the same value repeated inline across many elements (that's a token screaming to be
  extracted).
- **Already-Tailwind**: the classes are the spec. `bg-blue-600` → map to `--primary` if it's the
  brand action; `rounded-xl` → `--radius` family; `text-[13px]` → nearest type step or a token;
  arbitrary `bg-[#3B82F6]` → extract the hex. Don't import a foreign Tailwind config wholesale —
  reconcile to *this* project's theme.

### Detecting dark mode

shadcn themes are dual-mode (`:root` light + `.dark` dark), so always check whether the source
defines a dark variant and capture **both** palettes — don't fill light and leave shadcn's stale
dark defaults. Dark mode shows up in HTML/CSS as:

- **`@media (prefers-color-scheme: dark) { ... }`** — a block that re-declares colors/variables;
  those overrides are your `.dark` values.
- **A `.dark` / `[data-theme="dark"]` / `html.dark` / `body.dark` selector block** that re-values
  the same CSS variables (this is exactly shadcn's own shape — maps 1:1 to the `.dark` block).
- **A theme-toggle** in the markup (a button/switch with `data-theme`, `aria-label="dark mode"`,
  a moon/sun icon) — signals the design is meant to be dual-mode even if only one palette is fully
  specified; derive the missing mode rather than skipping it.
- **Tailwind `dark:` variants** in classes (`dark:bg-slate-900 dark:text-slate-100`) — read these
  as the dark palette and reconcile to `.dark` role tokens.

Pull a `{role: hex}` map for **each** mode (light + dark) and convert both with `hex_to_oklch.py`.
If the source is genuinely single-mode, say so and derive a sensible opposite mode (see
`theme-tokens.md` "Light & dark") instead of leaving defaults.

### A note on scope

Extract **tokens** (system-level, recurring values), not per-screen one-offs. A bespoke gradient
or a one-time background that isn't part of the system belongs to the component, not the global
theme. The theme is the reusable foundation every component then leans on.
