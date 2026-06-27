"use client";

import { CalendarIcon } from "lucide-react";
import { useController, type FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { FieldShell, type BaseFieldProps } from "./field-base";

export interface DateFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
}

/**
 * Date picker bound to React Hook Form. Stores a `Date`. Uses the browser locale
 * for display to avoid a date-formatting dependency; swap in `date-fns`/`dayjs`
 * formatting if your app already uses one.
 */
export function DateField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  placeholder = "Pick a date",
}: DateFieldProps<T>) {
  const { field, fieldState } = useController({ name, control });
  const value: Date | undefined = field.value ? new Date(field.value) : undefined;

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={fieldState.error}
      orientation={orientation}
      className={className}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
            onBlur={field.onBlur}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value ? value.toLocaleDateString() : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={field.onChange}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}
