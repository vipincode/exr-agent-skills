"use client";

import { isAxiosError } from "axios";
import { useForm, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Reuse the shared field set — do NOT recreate raw inputs (ARCHITECTURE: forms use *Field only).
import {
  InputField,
  SelectField,
  CheckboxField,
} from "@/components/shared/form";
import {
  createProductInput,
  type CreateProductInput,
} from "../schema/products.schema";

const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
];

type ProductFormProps = {
  /**
   * Called with validated form values. Should resolve on success and REJECT on
   * failure (e.g. let the mutation's error propagate) so this form can map the
   * server error onto the right field(s). On resolve, the form resets.
   */
  onSubmit: (values: CreateProductInput) => Promise<unknown>;
  isSubmitting?: boolean;
};

/**
 * Admin create-product form (RHF + Zod + shared *Field components).
 * The binding lives here: validation, dollars are kept as-entered (converted to
 * cents in the API fn), and server errors (422/409/401/5xx) are mapped to fields.
 */
export function ProductForm({ onSubmit, isSubmitting }: ProductFormProps) {
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductInput),
    defaultValues: {
      name: "",
      // left empty in the UI; coerced to a number by the schema on submit
      price: undefined as unknown as number,
      currency: "USD",
      category: "",
      inStock: true,
      imageUrl: "",
    },
  });

  const rootError = form.formState.errors.root?.message;

  const handleValid = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (err) {
      applyServerError(err, form.setError);
    }
  });

  return (
    <form onSubmit={handleValid} className="space-y-4" noValidate>
      <InputField control={form.control} name="name" label="Name" />
      <InputField
        control={form.control}
        name="price"
        label="Price (USD)"
        type="number"
        step="0.01"
        min="0"
      />
      <SelectField
        control={form.control}
        name="currency"
        label="Currency"
        options={CURRENCY_OPTIONS}
      />
      <InputField control={form.control} name="category" label="Category" />
      <InputField
        control={form.control}
        name="imageUrl"
        label="Image URL"
        placeholder="https://…"
      />
      <CheckboxField control={form.control} name="inStock" label="In stock" />

      {rootError ? (
        <p role="alert" className="text-sm text-red-500">
          {rootError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || form.formState.isSubmitting}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {isSubmitting || form.formState.isSubmitting ? "Saving…" : "Create product"}
      </button>
    </form>
  );
}

/** Map a backend error envelope onto RHF fields / the form root. */
function applyServerError(
  err: unknown,
  setError: UseFormSetError<CreateProductInput>,
) {
  if (isAxiosError(err) && err.response) {
    const { status } = err.response;
    const data = (err.response.data ?? {}) as {
      message?: string;
      errors?: Partial<Record<keyof CreateProductInput, string>>;
    };

    if (status === 422) {
      if (data.errors && Object.keys(data.errors).length > 0) {
        for (const [field, message] of Object.entries(data.errors)) {
          setError(field as keyof CreateProductInput, { message });
        }
      } else {
        setError("root", { message: data.message ?? "Validation failed." });
      }
      return;
    }

    if (status === 409) {
      setError("name", {
        message: data.message ?? "A product with this name already exists.",
      });
      return;
    }

    if (status === 401) {
      setError("root", {
        message: "Your session has expired. Please sign in again.",
      });
      return;
    }

    setError("root", { message: data.message ?? "Something went wrong." });
    return;
  }

  setError("root", { message: "Network error. Please try again." });
}
