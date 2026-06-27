"use client";

import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

import { type BaseFieldProps } from "./field-base";

export interface CheckboxFieldProps<T extends FieldValues> extends BaseFieldProps<T> {}

/**
 * Single boolean opt-in (terms, remember-me), bound to React Hook Form. The box
 * sits before the label (horizontal). Use `SwitchField` for an on/off toggle.
 */
export function CheckboxField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  className,
}: CheckboxFieldProps<T>) {
  const id = useId();
  const { field, fieldState } = useController({ name, control });

  return (
    <Field
      orientation="horizontal"
      data-invalid={fieldState.error ? true : undefined}
      className={cn(className)}
    >
      <Checkbox
        id={id}
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
      />
      <FieldContent>
        {label ? (
          <FieldLabel htmlFor={id} className="font-normal">
            {label}
            {required ? <span className="text-destructive"> *</span> : null}
          </FieldLabel>
        ) : null}
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
      </FieldContent>
    </Field>
  );
}
