# Building the component (Tailwind + tokens, the production-grade bar)

The model can already turn HTML into JSX. This doc is about doing it the way the project
expects: token-based Tailwind, the right component shape, faithful but not pixel-pinned —
and not just transliterating the source's `<div>` soup.

## Style with Tailwind utilities + theme tokens — never raw values

The source HTML is full of `#3B82F6`, `padding: 14px`, `border-radius: 12px`,
`box-shadow: 0 1px 2px rgba(0,0,0,.05)` — or the Tailwind equivalents `bg-[#3B82F6]`,
`p-[14px]`, `rounded-[12px]`. Translate each to the token system:

| Source raw | Use instead | Why |
| --- | --- | --- |
| `#3B82F6` / `bg-[#3B82F6]` (a brand color) | `bg-primary` / `text-primary` | themed, survives a redesign |
| `#71717A` (secondary text) | `text-muted-foreground` | semantic role |
| `border-radius: 12px` / `rounded-[12px]` | `rounded-xl` (or `rounded-[var(--radius)]`) | radius token |
| `box-shadow: …` | `shadow-card` / `shadow-sm` | shadow token |
| `font-family: Poppins` (headings) | `font-display` | font variable from theme |
| `gap: 14px` | `gap-3.5` | spacing scale |
| `font-size:14px; line-height:20px` | `text-sm` | type scale |

- Use **semantic color utilities** (`primary`, `muted-foreground`, `border`, `accent`) so
  components are themed by the theme tokens. Reach for an arbitrary value (`bg-[oklch(...)]`)
  only when there is genuinely no token — and prefer adding a token over scattering arbitrary
  values.
- **A recurring shadow/border/gradient with no token → add it to `globals.css` once** as a
  token exposed through `@theme inline` (`--shadow-card` → `shadow-card`,
  `--gradient-brand` → `bg-[image:var(--gradient-brand)]` or a small utility class) and use
  that utility everywhere. The second time you type the same `shadow-[0_1px_2px…]` or
  `bg-[linear-gradient(...)]` arbitrary value, it should have been a utility — that's how the
  design stays consistent when the values change. (Phase 1 seeds these tokens; extend them
  here when the markup reveals more.)
- **Already-Tailwind source**: don't just copy the classes. A foreign `bg-blue-600`/`text-sm`
  needs reconciling to *this* project's tokens (`bg-primary`/`text-sm`). Keep the layout/spacing
  classes; swap the palette/radius/shadow classes for token-based ones.
- **No separate `.css` files** and **no inline `style={{}}`** for things Tailwind expresses.
  Inline style is acceptable only for truly dynamic values (a computed transform, a CSS var set
  from a prop).
- Match spacing/gap/padding/radius/border/shadow/line-height faithfully — through utilities.

## Re-express the markup, don't transliterate it

The source may be `<div>`-only, table-based, or class-soup. Produce **semantic** JSX: a
`<header>` for the header, `<nav>` for nav, `<button>`/`<a>` for actions, headings in order —
not a literal `<div className="...">` copy of the input. The HTML is a layout/value reference;
the output is clean React.

## Responsive — mobile-first, always (non-negotiable)

Fixed-width HTML mockups hardcode widths and are usually drawn at desktop. **Every component must
be responsive, authored mobile-first** — never a desktop-pinned port. Concretely:

- **Base styles target mobile; layer up with breakpoint prefixes.** Write the small-screen layout
  as the unprefixed classes, then add `sm:`/`md:`/`lg:` for larger screens —
  `grid-cols-1 md:grid-cols-3`, `flex-col md:flex-row`, `px-4 md:px-8`, `text-2xl md:text-4xl`,
  `gap-4 md:gap-8`. Don't write desktop classes and bolt on `max-md:` overrides.
- **Never carry over a hardcoded desktop width** (`w-[1440px]`, `width: 1440px`). Use `w-full`,
  `container`/`max-w-*` with responsive padding; let content reflow.
- If the source has `@media` queries, honor them via Tailwind breakpoints. If it only shows one
  breakpoint, **infer the mobile layout** — stack columns, collapse grids to one, shrink
  type/spacing a step, hide-or-move secondary chrome — and note the responsive choices you made.

### Mobile navigation: hamburger + shadcn Sheet (required)

Any header/navbar with a horizontal nav, and any persistent sidebar, **must collapse on mobile
into a hamburger trigger that opens a shadcn `Sheet`** — don't just `hidden md:flex` the links
away with no mobile affordance.

- Add the primitive once: `<pm> dlx shadcn@latest add sheet` (and `button` if missing) into
  `components/ui/`.
- **Header/navbar:** desktop nav is `hidden md:flex`; the hamburger button is `md:hidden` with an
  `aria-label` (e.g. "Open menu") and a `Menu` lucide icon, wrapped in `SheetTrigger`. The same nav
  links render inside `SheetContent` (typically `side="left"` or `side="right"`), stacked
  vertically. This is a client component (`"use client"`, `useState` for open/close).
- **Sidebar:** render it inline on desktop (`hidden md:block` / `md:w-64`) and inside a left
  `Sheet` on mobile, opened by a hamburger in the mobile header. Prefer shadcn's `sidebar`
  primitive when the project uses it — it already wires the mobile Sheet behavior.
- Close the Sheet on link click/navigation; keep focus states and `aria-label`s intact.

## The design's variants live in `ui/` — retheme the primitive, don't override per use

shadcn primitives are CLI-added but they are **your code**, and their `cva` blocks are where the
project's design system lives. When the source design's buttons/badges/inputs don't match
shadcn's defaults, **edit the variant styles inside the primitive** (`components/ui/button.tsx`,
`badge.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`,
`dialog.tsx`, …):

- **Re-value existing variants** with theme tokens so `variant="default"`, `"outline"`,
  `"ghost"`, `"destructive"` render the design's button styles.
- **Add design-specific variants** the design defines (`variant="gradient"`, `size="xl"`,
  a pill `shape`) as new `cva` entries.
- Keep the component's API, behavior, and a11y wiring intact — restyling variants in place is
  **theming, not forking**. Forking (a hand-written sibling `Button2`, a copy-pasted file) is
  still forbidden.

The tell: if you're writing the same `className` overrides on a primitive at more than one call
site, those styles belong in the primitive's variants. **Wrap instead of edit** only when you're
adding structure or behavior, not looks — e.g. a `ConfirmModal` composing `ui/dialog`, an
`IconButton` adding an enforced `aria-label`. Purely visual difference → variant in `ui/`;
added composition/behavior → shared wrapper in `components/shared/`.

## Component shape

- **TypeScript props.** Explicit prop interface; data comes in as props (keeps shared
  components reusable — see shared-taxonomy.md "props over coupling"). Repeated markup becomes
  one component `.map()`-ed over a typed array, not N inline copies.
- **`cva` for variants.** Any component with visual variants (size/tone/theme — e.g. Hero
  size, Card emphasis, Badge color) uses `cva`. One component + variants beats N near-duplicates.
- **Server vs client.** Default to a **Server Component**. Add `"use client"` only when it needs
  interactivity/state/effects/browser APIs or framer-motion. Carousels, dropdowns, anything
  with `onClick`/`useState` → client. Static hero/card/section → server.
- **Compose primitives.** Build on `components/ui/*` and existing shared components; never
  fork a primitive (visual differences go into its `cva` variants — see the section above).
- **Barrel + register.** Shared component → add to its subfolder `index.ts` and to
  `MODULE_REGISTRY.md`.

## Assets & images

- `<img src="local.png">` → copy the file into `public/`, render with `next/image` (set
  `width`/`height` or `fill` + `sizes`). `<img src="https://...">` → download into `public/`
  rather than hotlinking a URL that may move or rate-limit.
- Small/recolorable SVGs (from inline `<svg>` in the source) → the icon registry
  (`components/shared/icons.tsx` — see "Icons" below), as `currentColor` components so `text-*`
  recolors them. Don't paste one-off `<svg>` blocks into components.
- `background-image: url(...)` → a theme token/utility if recurring (Phase 1), or a local asset +
  `bg-[image:url()]` / `next/image` with `fill` for one-offs.
- Alt text on every meaningful image (reuse the source's `alt` if present); `alt=""` for
  decorative.

## Icons — one library, one registry file

- **Library:** `lucide-react` (shadcn's default) for everything it covers; `react-icons` only
  for glyphs lucide lacks (brand/social marks). Never introduce a third icon set or mix styles —
  a design's icons read as one family only if they come from one. Source-HTML icon fonts
  (Font Awesome classes, Material Icons ligatures) get **mapped to lucide equivalents**, not
  carried over as font dependencies.
- **Registry:** one file — `components/shared/icons.tsx` — re-exports every icon the app uses
  and defines the custom SVGs:

  ```tsx
  // components/shared/icons.tsx — the app's entire icon set, in one place
  export { Menu, X, ChevronDown, Search, Bell } from "lucide-react";
  export { FaGithub } from "react-icons/fa";          // only when lucide lacks it

  export function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
    return <svg viewBox="0 0 24 24" fill="currentColor" {...props}>…</svg>;
  }
  ```

  Components import from `@/components/shared/icons` — **never** from `lucide-react`/
  `react-icons` directly, and never a pasted inline `<svg>`. Why: the whole icon set is
  auditable and swappable in one file, a source icon that maps to an existing export gets reused
  instead of re-pasted, and a design refresh touches one place. Register `icons.tsx` in
  `MODULE_REGISTRY.md` once; append new exports as designs need them.
- **Sizing/color via `className`** (`size-4`, `text-muted-foreground`) — custom SVGs use
  `currentColor` so the same theming works for all of them.

## Accessibility & polish (the "production-grade" bar)

- Semantic elements: `header`/`nav`/`main`/`section`/`footer`/`button`/`a`, headings in order.
- Interactive elements are real `button`/`a` with visible focus states (shadcn primitives give
  you these — another reason to compose them). A `<div onClick>` in the source becomes a real
  `<button>`.
- Hover/active/disabled/focus states from the design's `:hover`/`:focus` rules, via Tailwind
  state variants.
- `aria-*` where the design implies semantics (icon-only buttons need `aria-label`).

## Faithful, then better

Honor the design, but produce code a senior engineer would ship: tokenized, responsive,
accessible, variant-driven, semantic, no duplication. Transliterated-markup output (fixed
widths, raw hex, `<div>` soup, absolute-positioned everything, no semantics) is the anti-goal.
