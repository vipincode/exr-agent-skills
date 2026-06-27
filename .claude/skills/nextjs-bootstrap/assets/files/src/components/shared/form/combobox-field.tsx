"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useController, type FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { FieldShell, type BaseFieldProps, type FieldOption } from "./field-base";

export interface ComboboxFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: FieldOption[];
  placeholder?: string;
}

/** Searchable single-choice selector (long lists). Bound to React Hook Form. */
export function ComboboxField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  options,
  placeholder = "Select…",
}: ComboboxFieldProps<T>) {
  const { field, fieldState } = useController({ name, control });
  const current = options.find((o) => o.value === field.value);

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
            role="combobox"
            className={cn(
              "w-full justify-between",
              !current && "text-muted-foreground",
            )}
            onBlur={field.onBlur}
          >
            {current?.label ?? placeholder}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search…" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => field.onChange(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        field.value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  );
}
