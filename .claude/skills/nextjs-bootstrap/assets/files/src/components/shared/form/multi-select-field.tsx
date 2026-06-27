"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useController, type FieldValues } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
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

export interface MultiSelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: FieldOption[];
  placeholder?: string;
}

/**
 * Multiple-choice selector backed by a searchable popover. Stores an array of
 * `value`s in the form. Bound to React Hook Form.
 */
export function MultiSelectField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  options,
  placeholder = "Select…",
}: MultiSelectFieldProps<T>) {
  const { field, fieldState } = useController({ name, control });
  const selected: string[] = Array.isArray(field.value) ? field.value : [];

  const toggle = (value: string) => {
    field.onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

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
            className="h-auto min-h-9 w-full justify-between"
            onBlur={field.onBlur}
          >
            <span className="flex flex-wrap gap-1">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selected.map((value) => {
                  const opt = options.find((o) => o.value === value);
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        toggle(value);
                      }}
                    >
                      {opt?.label ?? value}
                      <X className="ml-1 size-3" />
                    </Badge>
                  );
                })
              )}
            </span>
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
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0",
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
