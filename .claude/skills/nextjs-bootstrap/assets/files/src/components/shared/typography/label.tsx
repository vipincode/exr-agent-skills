import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { Label as UiLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label primitive — the "extend, don't duplicate" pattern in action.
 *
 * shadcn already ships `ui/label` with accessible behavior, so we DO NOT
 * re-implement it. We compose it and add app-level `cva` variants (tone/size and
 * a `required` asterisk). The same principle applies to `Button`: it already has
 * variants, so build new primitives (Text/Heading) rather than re-skinning it.
 */
export const labelVariants = cva("", {
  variants: {
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      destructive: "text-destructive",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: {
    tone: "default",
    size: "md",
  },
});

export interface LabelProps
  extends ComponentProps<typeof UiLabel>,
    VariantProps<typeof labelVariants> {
  /** Append a destructive asterisk to mark a required field. */
  required?: boolean;
}

export function Label({
  className,
  tone,
  size,
  required,
  children,
  ...props
}: LabelProps) {
  return (
    <UiLabel className={cn(labelVariants({ tone, size }), className)} {...props}>
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </UiLabel>
  );
}
