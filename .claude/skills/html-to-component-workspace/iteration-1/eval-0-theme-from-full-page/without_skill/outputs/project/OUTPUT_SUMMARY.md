# Theme Setup — Output Summary

Theme extracted from `_docs/designs/landing.html` and applied to the project. No
dependencies were installed; only file edits were made.

## Files changed

- `src/app/globals.css` — replaced the placeholder grayscale tokens with the
  design's palette (all colors in `oklch`), plus radius, shadows, gradient and
  font wiring.
- `src/app/layout.tsx` — swapped Geist for the design's Google fonts (Inter +
  Poppins), kept Geist Mono for mono, updated metadata.
- `OUTPUT_SUMMARY.md` — this file.

## Tokens extracted (hex → oklch)

| Role | Design value | oklch |
|------|--------------|-------|
| primary (brand) | `#4f46e5` indigo-600 | `oklch(0.511 0.262 276.966)` |
| primary-press (hover) | `#4338ca` indigo-700 | `oklch(0.457 0.24 277.023)` |
| foreground (ink) | `#0f172a` slate-900 | `oklch(0.208 0.042 265.755)` |
| muted-foreground | `#64748b` slate-500 | `oklch(0.554 0.046 257.417)` |
| background / card | `#ffffff` | `oklch(1 0 0)` |
| secondary / muted / accent | `#f8fafc` slate-50 | `oklch(0.984 0.003 247.858)` |
| border / input | `#e2e8f0` slate-200 | `oklch(0.929 0.013 255.508)` |
| destructive | `#dc2626` red-600 | `oklch(0.577 0.245 27.325)` |
| gradient-to | `#7c3aed` violet-600 | `oklch(0.541 0.281 293.009)` |
| on-gradient-muted | `#ede9fe` violet-100 | `oklch(0.943 0.029 294.588)` |

## Other tokens

- **Radius:** `--radius: 0.625rem` (10px, from the design's buttons/inputs).
- **Shadows:** `--shadow-xs/sm` = `0 1px 2px` (buttons), `--shadow-md` =
  `0 4px 12px` (cards), tinted with the slate-900 ink color in oklch; plus a
  derived `--shadow-lg`.
- **Gradient:** `--gradient-hero: linear-gradient(135deg, #4f46e5 → #7c3aed)`
  exposed to Tailwind as `bg-gradient-hero` (via
  `--background-image-gradient-hero`). On-gradient text colors exposed as
  `text-on-gradient` / `text-on-gradient-muted`.
- **Fonts:** `--font-sans` = Inter (400/500/600, body), `--font-display` =
  Poppins (600/700, headings), `--font-mono` = Geist Mono. Headings default to
  the display font via a base-layer rule.

## Key decisions

- Mapped the design's flat CSS variables onto the shadcn token contract so
  existing UI primitives pick up the brand automatically: brand → `primary`,
  ink → `foreground`, surface-alt → `secondary`/`muted`/`accent`, line →
  `border`/`input`, brand → `ring`.
- Used Tailwind v4's canonical oklch values for the slate/indigo/violet/red
  Tailwind palette the design is built on (exact and consistent).
- Added a complementary dark mode (slate-900 base, indigo-400 brand) and a
  brand-derived chart + sidebar palette so the contract is fully populated,
  even though the source design is light-only.
- Extended the theme with non-shadcn extras the design needs (`primary-press`,
  hero gradient, on-gradient text, explicit shadow scale) rather than hardcoding
  them later in components.
