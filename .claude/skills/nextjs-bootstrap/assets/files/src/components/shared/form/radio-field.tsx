"use client";

import { useController, type FieldValues } from "react-hook-form";

import { FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { FieldShell, type BaseFieldProps, type FieldOption } from "./field-base";

export interface RadioFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: FieldOption[];
  /** Lay options out in a row instead of a column. */
  inline?: boolean;
}

/** One-of choice with every option visible, bound to React Hook Form. */
export function RadioField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  options,
  inline = false,
}: RadioFieldProps<T>) {
  const { field, fieldState } = useController({ name, control });

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={fieldState.error}
      orientation={orientation}
      className={className}
    >
      <RadioGroup
        value={field.value ?? ""}
        onValueChange={field.onChange}
        className={cn(inline ? "flex flex-row gap-4" : "flex flex-col gap-2")}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={optionId}
                disabled={option.disabled}
              />
              <FieldLabel htmlFor={optionId} className="font-normal">
                {option.label}
              </FieldLabel>
            </div>
          );
        })}
      </RadioGroup>
    </FieldShell>
  );
}
