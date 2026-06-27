import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import type {
  Control,
  FieldError as RHFFieldError,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Shared variants + a DRY shell for every `*Field`.
 *
 * Modern shadcn ships a form-library-agnostic `Field` primitive (Field /
 * FieldLabel / FieldDescription / FieldError) instead of the old RHF-bound
 * `Form`. So our shared fields bind React Hook Form themselves via
 * `useController` and render through that primitive. `FieldShell` is the one
 * place the label/description/error layout lives — every field reuses it.
 *
 * Because shadcn uses `cva`, our fields do too: `fieldControlVariants.size` is
 * the single knob that keeps control density consistent across the library.
 */
export const fieldControlVariants = cva("", {
  variants: {
    size: {
      sm: "h-8 text-xs",
      md: "h-9 text-sm",
      lg: "h-10 text-base",
    },
  },
  defaultVariants: { size: "md" },
});

export type FieldSize = NonNullable<
  VariantProps<typeof fieldControlVariants>["size"]
>;

export type FieldOrientation = "vertical" | "horizontal" | "responsive";

/** An option for the choice-based fields (Select, MultiSelect, Radio, Combobox). */
export interface FieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/** Props every field shares. Concrete fields extend this with their own bits. */
export interface BaseFieldProps<T extends FieldValues> {
  /** Field path in the form schema. */
  name: FieldPath<T>;
  /**
   * Optional RHF control. Omit it and the field reads `control` from the
   * surrounding form context (`useFormContext`) — so inside a form you rarely
   * pass it.
   */
  control?: Control<T>;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  required?: boolean;
  orientation?: FieldOrientation;
}

/**
 * The shared label → control → description → error layout. Vertical fields pass
 * the control as `children`; horizontal boolean fields (checkbox/switch) compose
 * the primitive directly instead, since their control comes before the label.
 */
export function FieldShell({
  id,
  label,
  required,
  description,
  error,
  orientation = "vertical",
  className,
  children,
}: {
  id?: string;
  label?: ReactNode;
  required?: boolean;
  description?: ReactNode;
  error?: RHFFieldError;
  orientation?: FieldOrientation;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field
      orientation={orientation}
      data-invalid={error ? true : undefined}
      className={cn(className)}
    >
      {label ? (
        <FieldLabel htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </FieldLabel>
      ) : null}
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}
