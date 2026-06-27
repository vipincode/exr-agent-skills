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
Theme applied from `_docs/designs/dashboard-dark.html`. Font: **Inter** via `next/font/google` (bound to `--font-sans`); `Geist_Mono` kept for `--font-mono`. Palette: indigo brand (`primary`), slate neutrals, in **oklch** across `:root` (light) and `.dark` (dark) — both captured from the design's own dual-mode palette (it ships a `prefers-color-scheme: dark` variant). `--radius` = 0.75rem (12px). Custom tokens: `--positive` (up-delta green) and the full `--sidebar-*` role set, exposed as `text-positive`, `bg-sidebar`, etc. via `@theme inline`.
