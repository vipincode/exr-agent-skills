"use client";

import { useId, type ComponentProps } from "react";
import { useController, type FieldValues } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";

import { FieldShell, type BaseFieldProps } from "./field-base";

export interface TextareaFieldProps<T extends FieldValues>
  extends BaseFieldProps<T>,
    Omit<ComponentProps<"textarea">, "name" | "size" | "defaultValue"> {}

/** Multi-line text input bound to React Hook Form. */
export function TextareaField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  ...textareaProps
}: TextareaFieldProps<T>) {
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
      <Textarea id={id} {...field} {...textareaProps} value={field.value ?? ""} />
    </FieldShell>
  );
}
