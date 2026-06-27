"use client";
import { useForm, FormProvider, useController, useFormContext } from "react-hook-form";
import { TextField } from "../components/text-field";
import { formatMoney } from "../../cart/lib/format"; // reuse the cart money formatter

function PriceInput() {
  const { control } = useFormContext();
  const { field } = useController({ name: "price", control });
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">Price (cents)</label>
      <input type="number" className="rounded-md border px-3 py-2" {...field} />
    </div>
  );
}

export function ProductForm() {
  const form = useForm({ defaultValues: { name: "", price: 0 } });
  const onSubmit = form.handleSubmit((values) => {
    fetch("/api/products", { method: "POST", body: JSON.stringify(values) });
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField name="name" label="Name" />
        <PriceInput />
        <p className="text-muted-foreground">Preview: {formatMoney(form.watch("price"))}</p>
        <button type="submit">Create</button>
      </form>
    </FormProvider>
  );
}
