"use client";
import { useController, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
// Shared RHF field — every form input goes through this, never bare <Controller>.
export function InputField({ name, control, label }: { name: string; control: Control<any>; label?: string }) {
  const { field, fieldState } = useController({ name, control });
  return (
    <div>
      {label && <label htmlFor={name}>{label}</label>}
      <Input id={name} {...field} />
      {fieldState.error && <span role="alert">{fieldState.error.message}</span>}
    </div>
  );
}
