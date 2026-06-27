# Fonts: wiring the design's typography into Next.js (`next/font`)

Fonts are set in `src/app/layout.tsx` using **`next/font`**, never `<link>` tags or CSS
`@import url()`. `next/font` self-hosts the font at build time (no network request, no layout
shift), and — the part the theme depends on — it exposes a **CSS variable** you bind in
`globals.css`'s `@theme` block. So: declare the font in `layout.tsx`, attach its variable to
`<html>`, reference the variable in `@theme inline` as `--font-sans` / `--font-mono` / a custom
`--font-display`.

## Finding which fonts the HTML uses

The source tells you the families in one of these ways — check all:
- **Google Fonts `<link>`** in the head (`fonts.googleapis.com/css2?family=Poppins:wght@500;600;700`)
  — the family name and the `wght` list map straight onto a `next/font/google` call.
- **`@font-face` rules / bundled font files** (`.woff2`, `.ttf`) — these are custom/brand fonts →
  `next/font/local`; the referenced files are your `src` paths.
- **`font-family:` declarations** in CSS / inline styles — the literal stack; the first named
  family is the one to wire (ignore the generic fallback like `sans-serif`).
- **Tailwind font classes** — `font-sans`/`font-serif`/`font-mono` map to the project's existing
  font slots; a custom class (`font-display`) points at a configured family. Note the intended
  role (body vs heading).

Translate the source's `<link>`/`@import`/`@font-face` into `next/font` — never carry the
`<link>` tag over.

## Google fonts (`next/font/google`)

For any family Google Fonts hosts (Inter, Geist, Poppins, Roboto, …). Match the **family and
weights** the HTML uses.

```tsx
// src/app/layout.tsx
import { Inter, Poppins } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",          // the CSS variable @theme will read
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],    // pin the weights the design uses (non-variable fonts need this)
  variable: "--font-display",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

Notes:
- **Variable fonts** (Inter, Geist) don't need a `weight` array — they ship all weights. Pin
  `weight` only for static families (Poppins, Roboto) and only the weights the design actually
  uses, to keep the bundle small.
- `subsets` is required; `["latin"]` unless the design needs more.

## Custom / brand fonts (`next/font/local`)

For licensed or bespoke fonts shipped as files (from the design's `@font-face`). Put the files
under `src/app/fonts/` (`.woff2` preferred) and load them locally.

```tsx
import localFont from "next/font/local";

const brand = localFont({
  src: [
    { path: "./fonts/Brand-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Brand-Medium.woff2",  weight: "500", style: "normal" },
    { path: "./fonts/Brand-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});
```

A single variable font file is simpler:
```tsx
const brand = localFont({
  src: "./fonts/Brand-Variable.woff2",
  variable: "--font-display",
  display: "swap",
});
```

Add `brand.variable` to the `<html className>` alongside the others. If the design references a
brand font you don't have the files for, flag it and fall back to the nearest Google family (or
ask the user to drop the `.woff2` into `src/app/fonts/`).

## Binding the variables in `globals.css`

The font variables from `layout.tsx` get mapped to Tailwind's font utilities in `@theme inline`:

```css
@theme inline {
  --font-sans: var(--font-sans);       /* body text → `font-sans` */
  --font-mono: var(--font-mono);       /* code → `font-mono` */
  --font-display: var(--font-display); /* headings/brand → `font-display` */
}
```

Now `font-sans`, `font-display`, etc. are real utilities. Set the body default
(`<body className="font-sans">`) and let the bootstrap's `Heading` primitive use `font-display`.

## Mapping the design → font roles

| Design usage | Role / variable | Utility |
| --- | --- | --- |
| Body / paragraph / UI text | `--font-sans` | `font-sans` (body default) |
| Headings / display / brand | `--font-display` (or `--font-serif`) | `font-display` |
| Code / monospace / data | `--font-mono` | `font-mono` |

If the HTML uses one family throughout, just set `--font-sans` and skip the rest. If headings use
a distinct display face, give that its own variable so headings and body stay separable.

## Checklist

- [ ] Every family the HTML uses is declared in `layout.tsx` (google or local), with the right weights.
- [ ] Each font has a `variable`, all variables are on `<html className>`.
- [ ] Variables bound in `@theme inline` and used as `font-*` utilities.
- [ ] `<body>` sets the default family; headings use the display family.
- [ ] No `<link rel="stylesheet">` to Google Fonts and no `@import url()` carried over from the source.
- [ ] Build passes (font files resolve, no missing-weight warnings).
