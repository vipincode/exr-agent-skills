// A reusable labeled text input for forms.
import { useController, useFormContext } from "react-hook-form";

export function TextField({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input className="rounded-md border px-3 py-2" {...field} />
      {fieldState.error ? (
        <span className="text-sm text-red-500">{fieldState.error.message}</span>
      ) : null}
    </div>
  );
}
