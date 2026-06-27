"use client";

import { useId, type ComponentProps } from "react";
import { useController, type FieldValues } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  FieldShell,
  fieldControlVariants,
  type BaseFieldProps,
  type FieldSize,
} from "./field-base";

export interface InputFieldProps<T extends FieldValues>
  extends BaseFieldProps<T>,
    Omit<ComponentProps<"input">, "name" | "size" | "defaultValue"> {
  /** Control density variant (sm/md/lg). */
  size?: FieldSize;
}

/**
 * Text/email/password/number input bound to React Hook Form. Inside a form you
 * only need `name`, `label`, and optionally `type`/`placeholder`.
 */
export function InputField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  size,
  orientation,
  className,
  ...inputProps
}: InputFieldProps<T>) {
  const id = useId();
  const { field, fieldState } = useController({ name, control });

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      description={description}
      error={fieldState.error}
      orientation={orientation}
      className={className}
    >
      <Input
        id={id}
        {...field}
        {...inputProps}
        value={field.value ?? ""}
        className={cn(fieldControlVariants({ size }))}
      />
    </FieldShell>
  );
}
