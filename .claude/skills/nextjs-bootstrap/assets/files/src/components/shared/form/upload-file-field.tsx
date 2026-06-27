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

export interface UploadFileFieldProps<T extends FieldValues>
  extends BaseFieldProps<T>,
    Omit<ComponentProps<"input">, "name" | "size" | "type" | "value" | "defaultValue"> {
  /** Allow selecting multiple files (stores `File[]`); otherwise stores one `File`. */
  multiple?: boolean;
  /** Control density variant (sm/md/lg). */
  size?: FieldSize;
}

/**
 * File upload bound to React Hook Form. File inputs are uncontrolled for their
 * value, so we forward the ref and push the selected `File`/`File[]` into the
 * form on change. Validate with a Zod schema (size/type) on the form.
 */
export function UploadFileField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  orientation,
  className,
  multiple,
  size,
  ...inputProps
}: UploadFileFieldProps<T>) {
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
        {...inputProps}
        id={id}
        type="file"
        multiple={multiple}
        name={field.name}
        ref={field.ref}
        onBlur={field.onBlur}
        disabled={field.disabled}
        className={cn(fieldControlVariants({ size }))}
        onChange={(event) => {
          const files = event.target.files;
          if (!files) return field.onChange(multiple ? [] : undefined);
          field.onChange(multiple ? Array.from(files) : files[0]);
        }}
      />
    </FieldShell>
  );
}
