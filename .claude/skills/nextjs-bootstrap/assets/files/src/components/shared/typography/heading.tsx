import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Heading primitive. `level` picks the semantic tag (h1–h6); `size` controls the
 * visual scale independently, so a visually-small `h2` stays correct in the
 * document outline. `cva` keeps the type scale consistent app-wide.
 */
export const headingVariants = cva("font-semibold tracking-tight text-foreground", {
  variants: {
    size: {
      xl: "text-4xl",
      lg: "text-3xl",
      md: "text-2xl",
      sm: "text-xl",
      xs: "text-lg",
    },
    weight: {
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    size: "lg",
    weight: "semibold",
  },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps
  extends Omit<ComponentProps<"h2">, "color">,
    VariantProps<typeof headingVariants> {
  /** Semantic heading level (1–6). Defaults to 2. */
  level?: HeadingLevel;
}

export function Heading({
  level = 2,
  size,
  weight,
  className,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag className={cn(headingVariants({ size, weight }), className)} {...props} />
  );
}
