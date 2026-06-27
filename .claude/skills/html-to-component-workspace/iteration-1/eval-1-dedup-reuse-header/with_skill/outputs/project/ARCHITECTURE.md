# Frontend Architecture

Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui.

## Structure
- `src/app/` — routes, `layout.tsx`, `globals.css` (theme tokens live here).
- `src/components/ui/` — shadcn primitives (composed, never forked).
- `src/components/shared/<group>/` — generic reusable components (layout, data-display, marketing, feedback, navigation, brand). Each group has an `index.ts` barrel.
- `src/features/<name>/` — feature modules (`components/`, `api/`, `hooks/`, `types/`, `template/`).

## Conventions
- Style with Tailwind utilities + theme tokens (`bg-primary`, `text-muted-foreground`, `rounded-lg`, `shadow-card`, `font-display`). No raw hex/px when a token exists. No separate CSS files; no inline `style={{}}` for static styling.
- Theme colors are **oklch** in `globals.css` (`:root` / `.dark` / `@theme inline`).
- Fonts via `next/font` in `layout.tsx`, bound as `--font-*` variables.
- Components with visual variants use `cva`. Default to Server Components; `"use client"` only when needed.
- Reuse before creating — check `MODULE_REGISTRY.md` first. Generic → `components/shared/`, feature-coupled → `features/<name>/components/`.

## Theme / fonts
Theme derived from `_docs/designs/pricing.html`. Palette in **oklch** (`globals.css`):
`primary` = indigo `#4f46e5`, neutrals = slate scale (`foreground` slate-900, `muted-foreground`
slate-500, `border` slate-200), `accent` = indigo-50. Light mode is from the design; dark mode is
**derived** (neutrals flipped, brand hue/chroma kept with lightness nudged up). Custom tokens:
`--shadow-card`, `--shadow-card-featured`. Fonts via `next/font` in `layout.tsx` — **Inter** backs
both `--font-sans` (body) and `--font-display` (headings/brand); `Geist_Mono` backs `--font-mono`.
