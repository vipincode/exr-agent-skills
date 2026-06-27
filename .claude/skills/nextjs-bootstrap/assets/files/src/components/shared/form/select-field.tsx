"use client";

import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FieldShell, type BaseFieldProps, type FieldOption } from "./field-base";

export interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: FieldOption[];
  placeholder?: string;
}

/** Single choice from a dropdown, bound to React Hook Form. */
export function SelectField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  options,
  placeholder = "Select…",
}: SelectFieldProps<T>) {
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
      <Select
        value={field.value ?? ""}
        onValueChange={field.onChange}
        disabled={field.disabled}
      >
        <SelectTrigger id={id} className="w-full" onBlur={field.onBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}
