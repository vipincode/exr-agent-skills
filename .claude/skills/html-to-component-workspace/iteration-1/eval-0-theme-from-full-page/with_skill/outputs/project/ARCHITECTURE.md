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
Theme applied from `_docs/designs/landing.html` (Acme landing). Colors are **oklch** in `globals.css` (`:root` light, `.dark` derived, `@theme inline`).
- Palette: brand indigo `#4f46e5` → `--primary` (ring = primary tint); slate ink `#0f172a` → `--foreground`; slate-500 `#64748b` → `--muted-foreground`; slate-50 `#f8fafc` → `--secondary`/`--muted`; slate-200 `#e2e8f0` → `--border`/`--input`; violet-100 `#ede9fe` (hero accent) → `--accent`; `#dc2626` → `--destructive`. `--background`/`--card` = white.
- Radius: `--radius: 0.625rem` (10px buttons); cards use `rounded-xl` (14px).
- Extras: `--shadow-button`, `--shadow-card`, and `--gradient-brand` (hero `linear-gradient(135deg, indigo → violet)`) exposed as utilities (`shadow-card`, `bg-[image:var(--gradient-brand)]`).
- Fonts (`next/font`): **Inter** (400/500/600) → `--font-sans` (body); **Poppins** (600/700) → `--font-display` (headings); Geist Mono → `--font-mono`.
- Dark mode was **derived** (source is light-only): neutrals flipped, brand hue/chroma kept with lightness nudged up, borders as low-alpha white.
