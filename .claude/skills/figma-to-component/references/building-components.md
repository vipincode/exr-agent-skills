# Building the component (Tailwind + tokens, the production-grade bar)

The model can already turn a layout into JSX. This doc is about doing it the way the project
expects: token-based Tailwind, the right component shape, faithful but not pixel-pinned.

## Style with Tailwind utilities + theme tokens — never raw values

The Figma reference code is full of `#3B82F6`, `padding: 14px`, `border-radius: 12px`,
`box-shadow: 0 1px 2px rgba(0,0,0,.05)`. Translate each to the token system:

| Figma raw | Use instead | Why |
| --- | --- | --- |
| `#3B82F6` (a brand color) | `bg-primary` / `text-primary` | themed, survives a redesign |
| `#71717A` (secondary text) | `text-muted-foreground` | semantic role |
| `border-radius: 12px` | `rounded-xl` (or `rounded-[var(--radius)]`) | radius token |
| `box-shadow: …` | `shadow-card` / `shadow-sm` | shadow token |
| `font-family: Poppins` (headings) | `font-display` | font variable from theme |
| `gap: 14px` | `gap-3.5` | spacing scale |
| `font-size:14px; line-height:20px` | `text-sm` | type scale |

- Use **semantic color utilities** (`primary`, `muted-foreground`, `border`, `accent`) so
  components are themed by `font-theme-setup`'s tokens. Reach for an arbitrary value
  (`bg-[oklch(...)]`) only when there is genuinely no token — and prefer adding a token over
  scattering arbitrary values.
- **No separate `.css` files** and **no inline `style={{}}`** for things Tailwind expresses.
  Inline style is acceptable only for truly dynamic values (a computed transform, a CSS var set
  from a prop).
- Match spacing/gap/padding/radius/border/shadow/line-height faithfully — through utilities.

## Responsive — mobile-first, always (non-negotiable)

Figma frames are fixed-width and usually drawn at desktop. **Every component must be responsive,
authored mobile-first** — never a desktop-pinned port. Concretely:

- **Base styles target mobile; layer up with breakpoint prefixes.** Write the small-screen layout
  as the unprefixed classes, then add `sm:`/`md:`/`lg:` for larger screens —
  `grid-cols-1 md:grid-cols-3`, `flex-col md:flex-row`, `px-4 md:px-8`, `text-2xl md:text-4xl`,
  `gap-4 md:gap-8`. Don't write desktop classes and bolt on `max-md:` overrides.
- **Never hardcode a desktop width** (`w-[1440px]`, `width: 1440px`). Use `w-full`,
  `container`/`max-w-*` with responsive padding for page width; let content reflow.
- The Figma frame typically shows one breakpoint. **Infer the mobile layout** — stack columns,
  collapse multi-column grids to one, shrink type/spacing a step, hide-or-move secondary chrome —
  and note the responsive choices you made.

### Mobile navigation: hamburger + shadcn Sheet (required)

Any header/navbar with a horizontal nav, and any persistent sidebar, **must collapse on mobile
into a hamburger trigger that opens a shadcn `Sheet`** — don't just `hidden md:flex` the links
away with no mobile affordance.

- Add the primitive once: `shadcn add sheet` (and `button` if missing) into `components/ui/`.
- **Header/navbar:** desktop nav is `hidden md:flex`; the hamburger button is `md:hidden` with an
  `aria-label` (e.g. "Open menu") and a `Menu` lucide icon, wrapped in `SheetTrigger`. The same nav
  links render inside `SheetContent` (typically `side="left"` or `side="right"`), stacked
  vertically. This is a client component (`"use client"`, `useState` for open/close).
- **Sidebar:** render it inline on desktop (`hidden md:block` / `md:w-64`) and inside a left
  `Sheet` on mobile, opened by a hamburger in the mobile header. Prefer shadcn's `sidebar`
  primitive when the project uses it — it already wires the mobile Sheet behavior.
- Close the Sheet on link click/navigation; keep focus states and `aria-label`s intact.

## Component shape

- **TypeScript props.** Explicit prop interface; data comes in as props (keeps shared
  components reusable — see shared-taxonomy.md "props over coupling").
- **`cva` for variants.** Any component with visual variants (size/tone/theme — e.g. Hero
  size, Card emphasis, Badge color) uses `cva`, matching the project's typography/`*Field`
  pattern. One component + variants beats N near-duplicates.
- **Server vs client.** Default to a **Server Component**. Add `"use client"` only when it needs
  interactivity/state/effects/browser APIs or framer-motion. Carousels, dropdowns, anything
  with `onClick`/`useState` → client. Static hero/card/section → server.
- **Compose primitives.** Build on `components/ui/*` and existing shared components; never
  re-skin a primitive.
- **Barrel + register.** Shared component → add to its subfolder `index.ts` and to
  `MODULE_REGISTRY.md`.

## Assets & images

- `next/image` for raster images (set `width`/`height` or `fill` + `sizes`); import from
  `public/`.
- Inline small/recolorable icons as SVG components using `currentColor` so `text-*` recolors
  them.
- Background images → a theme token/utility if recurring (font-theme-setup), or a local asset +
  `bg-[image:url()]` / `next/image` with `fill` for one-offs.
- Alt text on every meaningful image; `alt=""` for decorative.

## Accessibility & polish (the "production-grade" bar)

- Semantic elements: `header`/`nav`/`main`/`section`/`footer`/`button`/`a`, headings in order.
- Interactive elements are real `button`/`a` with visible focus states (shadcn primitives give
  you these — another reason to compose them).
- Hover/active/disabled/focus states from the design, via Tailwind state variants.
- `aria-*` where the design implies semantics (icon-only buttons need `aria-label`).

## Faithful, then better

Honor the design, but produce code a senior engineer would ship: tokenized, responsive,
accessible, variant-driven, no duplication. Exported-markup-looking output (fixed widths, raw
hex, absolute-positioned everything, no semantics) is the anti-goal.
