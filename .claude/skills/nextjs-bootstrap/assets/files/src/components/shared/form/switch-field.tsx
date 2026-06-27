"use client";

import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { type BaseFieldProps } from "./field-base";

export interface SwitchFieldProps<T extends FieldValues> extends BaseFieldProps<T> {}

/** Boolean on/off toggle (settings), bound to React Hook Form. */
export function SwitchField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  className,
}: SwitchFieldProps<T>) {
  const id = useId();
  const { field, fieldState } = useController({ name, control });

  return (
    <Field
      orientation="horizontal"
      data-invalid={fieldState.error ? true : undefined}
      className={cn("rounded-lg border p-3", className)}
    >
      <FieldContent>
        {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
      </FieldContent>
      <Switch
        id={id}
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
        disabled={field.disabled}
      />
    </Field>
  );
}
