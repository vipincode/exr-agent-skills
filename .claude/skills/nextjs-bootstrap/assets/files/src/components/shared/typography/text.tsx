import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Body/inline text primitive. `cva` gives it consistent variants so copy across
 * the app doesn't drift into one-off `text-sm text-muted-foreground` strings.
 * Use `asChild` to render as a different element (e.g. a `<span>` or `<label>`).
 */
export const textVariants = cva("leading-relaxed", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      lead: "text-lg text-muted-foreground",
      destructive: "text-destructive",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    weight: "normal",
  },
});

export interface TextProps
  extends ComponentProps<"p">,
    VariantProps<typeof textVariants> {
  asChild?: boolean;
}

export function Text({
  className,
  variant,
  size,
  weight,
  asChild = false,
  ...props
}: TextProps) {
  const Comp = asChild ? Slot : "p";
  return (
    <Comp
      className={cn(textVariants({ variant, size, weight }), className)}
      {...props}
    />
  );
}
