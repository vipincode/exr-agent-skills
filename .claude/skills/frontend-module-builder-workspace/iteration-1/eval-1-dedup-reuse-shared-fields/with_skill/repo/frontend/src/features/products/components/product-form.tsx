"use client";

import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Reuse the shared field set — do NOT recreate field UI / raw inputs.
import { InputField, SelectField, CheckboxField } from "@/components/shared/form";
import { createProductInput } from "../schema/products.schema";
import type { CreateProductInput } from "../types/products";

/** API requires a 3-char ISO 4217 code; defaults to USD server-side. */
const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
];

type ProductFormProps = {
  /** Called with validated form values + the form instance (for server-error mapping). */
  onSubmit: (
    values: CreateProductInput,
    form: UseFormReturn<CreateProductInput>,
  ) => void | Promise<void>;
  isSubmitting?: boolean;
  /** Top-level (non-field) error, e.g. network / 5xx. */
  submitError?: string | null;
};

/**
 * Create-product form. Design gap filled with a lightweight RHF form COMPOSED
 * from the shared `*Field` components (no raw inputs, no hand-rolled error text).
 * Price is entered in dollars; the binding layer converts to cents on submit.
 */
export function ProductForm({ onSubmit, isSubmitting = false, submitError }: ProductFormProps) {
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductInput),
    defaultValues: {
      name: "",
      currency: "USD",
      category: "",
      inStock: true,
      imageUrl: "",
    },
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values, form))}
        className="space-y-4"
        noValidate
      >
        <InputField name="name" label="Name" placeholder="Aero Mug" />
        <InputField
          name="price"
          label="Price"
          type="number"
          step="0.01"
          min="0"
          placeholder="24.00"
        />
        <SelectField name="currency" label="Currency" options={CURRENCY_OPTIONS} />
        <InputField name="category" label="Category" placeholder="Drinkware" />
        <InputField name="imageUrl" label="Image URL" placeholder="https://…" />
        <CheckboxField name="inStock" label="In stock" />

        {(rootError || submitError) && (
          <p role="alert" className="text-sm text-red-500">
            {rootError ?? submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Create product"}
        </button>
      </form>
    </FormProvider>
  );
}
