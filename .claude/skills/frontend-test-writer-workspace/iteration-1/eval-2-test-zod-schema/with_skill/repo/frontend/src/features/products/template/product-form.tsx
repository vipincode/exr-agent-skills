"use client";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputField, SelectField } from "@/components/shared/form";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProductMutation } from "../hooks/use-products";
import { createProductSchema } from "../schema/products.schema";

type CreateProductInput = z.infer<typeof createProductSchema>;

export function ProductForm() {
  const { user } = useAuth();
  const mutation = useCreateProductMutation();
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: "", price: 0, currency: "USD", category: "", inStock: true },
  });

  if (user?.role !== "admin") return null; // admin-only UI

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <InputField name="name" label="Name" />
        <InputField name="price" label="Price (cents)" type="number" />
        <SelectField name="category" label="Category" options={[{ label: "Drinkware", value: "drinkware" }]} />
        {mutation.isError ? <p role="alert">Couldn’t create the product.</p> : null}
        <button type="submit" disabled={mutation.isPending}>Create</button>
      </form>
    </FormProvider>
  );
}
