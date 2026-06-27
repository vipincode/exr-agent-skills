# Mapping HTML tokens → shadcn theme (Tailwind v4)

This is where extracted values become a working theme. shadcn's theme is a **fixed set of
semantic roles** stored as oklch CSS variables in `globals.css`, in three blocks: `:root`
(light), `.dark` (dark), and `@theme inline` (maps the variables to Tailwind utility names).
You re-value the roles; you don't rename them.

## The shadcn role set (map every HTML color onto these)

| Role (`--name`) | What it is | Typical HTML source |
| --- | --- | --- |
| `background` / `foreground` | page bg / default text | `body { background / color }` |
| `card` / `card-foreground` | surface bg / text on it | `.card`, panel/surface bg |
| `popover` / `popover-foreground` | menus/tooltips | usually = card |
| `primary` / `primary-foreground` | brand action + readable text on it | the main button/link/CTA color |
| `secondary` / `secondary-foreground` | secondary surfaces/buttons | secondary button, light neutral |
| `muted` / `muted-foreground` | subtle bg / secondary text | `.text-muted`, subtle section bg |
| `accent` / `accent-foreground` | hover/active emphasis | hover bg, highlight tint |
| `destructive` / `destructive-foreground` | danger/delete | red/error color |
| `border` | hairlines, dividers | `border-color`, `<hr>`, divider |
| `input` | form control border/bg | input border (often = border) |
| `ring` | focus ring | `:focus` outline (often a tint of primary) |
| `chart-1`..`chart-5` | data-viz series | chart/category colors |
| `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring` | sidebar surface set | sidebar/nav colors, else derive |

Rules of thumb:
- A `*-foreground` must be **readable on** its pair — usually the text color sitting on that
  background in the HTML; if absent, pick near-white or near-black by contrast.
- Map onto roles **before** inventing new tokens. Only add a custom token (e.g. `--brand-yellow`)
  when the design uses a raw color with no semantic job. Add custom tokens in the same blocks and
  expose them via `@theme inline` so they become utilities (`bg-brand-yellow`).
- **Already-Tailwind HTML**: `bg-blue-600` on the CTA → `--primary`; `text-gray-500` → 
  `--muted-foreground`; `border-gray-200` → `--border`. Reconcile to roles; don't import the
  source's whole palette as raw tokens.

## The three blocks (Tailwind v4 shape)

Keep this structure; swap the values with your oklch output. `@theme inline` is what turns
`--primary` into the `bg-primary` / `text-primary` utilities and the shadcn `--color-*` names.

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";        /* if present from scaffold */
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;            /* from the design's corner radius; md ≈ 10px = 0.625rem */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.6231 0.188 259.81);        /* ← converter output */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  /* ...chart-2..5, sidebar-* ... */

  /* extras this skill adds when the design defines them: */
  --shadow-card: 0 1px 2px 0 oklch(0 0 0 / 0.05);
  --gradient-brand: linear-gradient(135deg, oklch(0.62 0.19 260), oklch(0.55 0.21 300));
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ...every role re-valued for dark; mirror the :root keys exactly... */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ...one --color-* per role... */

  /* fonts: bind the next/font variables from layout.tsx (see fonts.md) */
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);

  /* custom shadow/gradient utilities */
  --shadow-card: var(--shadow-card);
}
```

## Light & dark

shadcn's theme is dual-mode by design: a `:root` (light) block and a `.dark` (dark) block with
the **same role names**, re-valued. Always produce **both** — leaving shadcn's stale default dark
palette under a custom light theme is a regression (the app's dark mode would look nothing like
the design).

**If the source defines dark explicitly** (a `.dark` / `[data-theme="dark"]` block, a
`prefers-color-scheme: dark` media query, or `dark:` Tailwind variants — see
`reading-html.md` "Detecting dark mode"): convert that palette to oklch and drop it straight into
the `.dark` block, role for role. This is the ideal case — the design told you both modes.

**If the source is single-mode** (only light, or only dark): fill the mode you have fully, then
**derive** the other instead of leaving defaults — and tell the user you derived it. A reliable
derivation in oklch (which is why shadcn uses it — lightness is perceptual):

- **Flip the neutrals' lightness.** `background`/`card`/`popover` go dark (L ≈ 0.13–0.21);
  `foreground` and the `*-foreground` text roles go light (L ≈ 0.95–0.99). Swap the light-mode
  `background`↔`foreground` lightness as the starting point.
- **Keep brand hue & chroma, nudge lightness up.** `primary`/`destructive`/`accent` keep their
  H and C; raise L slightly (~+0.05–0.1) so they read on a dark surface. On dark, shadcn often
  makes `primary` the light neutral and uses the brand as accent — match whichever the design implies.
- **Borders/inputs become low-alpha light.** `--border: oklch(1 0 0 / 10%)`,
  `--input: oklch(1 0 0 / 15%)` (hairlines as translucent white) instead of a solid light gray.
- **Mirror the keys exactly.** Every role in `:root` must exist in `.dark` — no missing roles, or
  that component is unthemed in dark mode.

Make sure `globals.css` carries `@custom-variant dark (&:is(.dark *))` (Tailwind v4) so `.dark` on
`<html>`/`<body>` activates the block; the project's theme toggle (if any) flips that class.

## Radius

Design corner radius (px) → `--radius` (rem). shadcn derives `sm/md/lg/xl` from it via the
`@theme inline` `calc()` lines, so set the base once. 8px → `0.5rem`, 10px → `0.625rem`,
12px → `0.75rem`, 16px → `1rem`. Components use `rounded-md`/`rounded-lg`, never a hardcoded px.

## Shadows

CSS `box-shadow` → `--shadow-<name>` token. Keep offset/blur/spread; convert the color to oklch
(usually black at low alpha). Expose in `@theme inline` so `shadow-card` works as a utility.
Tailwind v4 also reads `--shadow-*` for the built-in `shadow-*` scale if you'd rather override
those.

## Gradients

`linear-gradient(...)`/`radial-gradient(...)` from the CSS → a token:
`--gradient-brand: linear-gradient(<angle>, <stop1>, <stop2>, ...)` with each stop in oklch.
Use through `bg-[image:var(--gradient-brand)]` or a small utility class. Capture angle and stops
exactly from the source.

## Background images

A recurring background (texture, hero pattern) referenced via `background-image: url(...)` →
copy the asset into `public/` and expose a token/utility
(`--bg-hero: url('/bg/hero.png')` → `bg-[image:var(--bg-hero)]`). Per-screen one-off backgrounds
belong to the component, not the global theme.

## Typography scale

Font **families** come from `next/font` variables (see `fonts.md`). The **size/line-height**
scale: if the design uses a deliberate set of sizes (a display, an H1, H2, body, caption with
specific size+line-height+weight), encode it as theme tokens so the typography primitives and
utilities stay consistent:

```css
@theme inline {
  --text-display: 3.5rem;        --text-display--line-height: 1.05;
  --text-h1: 2.25rem;            --text-h1--line-height: 1.15;
  --text-body: 1rem;             --text-body--line-height: 1.6;
}
```

These become `text-display`, `text-h1`, etc. Wire the bootstrap's `Heading`/`Text` cva variants
to them rather than scattering `text-[56px] leading-[1.05]` across components.
