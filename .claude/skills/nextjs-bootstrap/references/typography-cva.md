# Typography primitives (cva) — "extend, don't duplicate"

`components/shared/typography` holds `Text`, `Heading`, and `Label`, each built with `cva` and at
least three variants. They give the app one consistent type scale instead of scattered
`text-sm text-muted-foreground` strings. Read this before overlaying the folder.

## The guiding rule (answers "buttons already have variants")

shadcn ships some components that already carry their own `cva` variants — notably **`Button`** and
**`ui/label`**. The right move is **not** to re-skin or re-implement those. It's to:

- **Build the primitives shadcn doesn't ship** — `Text` and `Heading` — as new `cva` components.
- **Extend the ones it does ship** — our `Label` composes `ui/label` and adds tone/size variants plus
  a `required` asterisk, rather than duplicating its accessible behavior.
- **Leave `Button` alone** — use its existing `variant`/`size` props. If you need a new button look,
  add a variant to the `ui/button` `cva` config (a shadcn-sanctioned edit), don't wrap it in a shadow
  component.

This keeps a single source of truth per concern and avoids two diverging "label" or "button"
implementations.

## What each provides

- **`Text`** — body/inline text. Variants: `variant` (default/muted/lead/destructive), `size`
  (sm/md/lg), `weight` (normal/medium/semibold). `asChild` renders as another element via Radix `Slot`.
- **`Heading`** — `level` (1–6) picks the semantic tag; `size` (xs–xl) sets the visual scale
  independently so the document outline stays correct; `weight` (medium/semibold/bold).
- **`Label`** — composes `ui/label`; variants `tone` (default/muted/destructive) and `size`
  (sm/md/lg), plus `required`.

## When to use which label

- Inside a shared `*Field`, the field already renders shadcn `FieldLabel` (which wires `htmlFor` and
  error state) — don't add our `Label` there.
- Use the shared `Label` for standalone labels outside the RHF field components (e.g. a label beside a
  custom control, or in a non-form layout).

## Adding a variant

Add it to the relevant `cva` config (`textVariants` / `headingVariants` / `labelVariants`) so every
usage gets it. Don't fork a component to get a one-off style.
