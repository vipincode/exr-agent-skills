# Theme Setup — Summary

Theme extracted from `_docs/designs/landing.html` (Acme landing page) and applied to the project. Phase 1 (theme) only — no components built.

## Files changed
- `src/app/globals.css` — re-valued all shadcn color roles in **oklch** (`:root` light + derived `.dark`), set radius, added shadow + gradient tokens and exposed them via `@theme inline`.
- `src/app/layout.tsx` — swapped Geist for the design's fonts via `next/font/google` (Inter + Poppins), kept Geist Mono; updated metadata.
- `ARCHITECTURE.md` — documented the concrete theme (palette source, oklch, fonts, derived dark).
- `MODULE_REGISTRY.md` — logged the theming decision.

## Palette → role mapping (oklch)
| Design value | shadcn role |
| --- | --- |
| `#4f46e5` indigo (brand action) | `--primary` (and `--ring`) |
| `#ffffff` surface | `--background`, `--card`, `--popover` |
| `#0f172a` slate-900 ink | `--foreground` / `*-foreground` on light surfaces |
| `#f8fafc` slate-50 (section bg) | `--secondary`, `--muted` |
| `#64748b` slate-500 (secondary text) | `--muted-foreground` |
| `#e2e8f0` slate-200 (hairlines) | `--border`, `--input` |
| `#ede9fe` violet-100 (hero accent) | `--accent` |
| `#4338ca` indigo-press | `--accent-foreground` |
| `#dc2626` | `--destructive` |

All colors converted with `scripts/hex_to_oklch.py`. Raw hex never written into theme variables.

## Radius / shadows / gradient
- `--radius: 0.625rem` (10px, buttons). Cards' 14px radius = `rounded-xl` (radius + 4px).
- `--shadow-button` = `0 1px 2px oklch(0.2077 0.0398 265.75 / 0.08)` → utility `shadow-button`.
- `--shadow-card` = `0 4px 12px oklch(0.2077 0.0398 265.75 / 0.06)` → utility `shadow-card`.
- `--gradient-brand` = `linear-gradient(135deg, indigo → violet #7c3aed)` → `bg-[image:var(--gradient-brand)]` (hero background).

## Fonts (next/font, no `<link>` carried over)
- **Inter** (400/500/600) → `--font-sans`, body default (`font-sans`).
- **Poppins** (600/700) → `--font-display`, for headings (`font-display`). Matches design's `h1/h2/h3 { font-family: Poppins }`.
- **Geist Mono** → `--font-mono` (retained).

## Light / dark
- Light = the design directly.
- The source is **single-mode (light only)** — dark was **derived**: neutrals flipped to dark slate, brand hue/chroma kept with lightness nudged up (~+0.08) so it reads on dark, borders/inputs as low-alpha white. Every `:root` role is mirrored in `.dark`.

Note: build-verify (`npm run build`) was skipped per instructions (no `node_modules`).
