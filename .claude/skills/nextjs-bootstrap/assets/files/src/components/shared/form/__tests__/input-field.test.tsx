import { zodResolver } from "@hookform/resolvers/zod";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import * as z from "zod";

import { applyServerErrors } from "@/lib/api/errors";
import { api } from "@/lib/axios";

import { server, validationFailed } from "../../../../../test/msw";
import { renderWithProviders } from "../../../../../test/render";
import { InputField } from "../input-field";

// Component example: a real RHF form with the shared field, client-side Zod
// validation, and the backend's 400 details landing on the right field.
const schema = z.object({ sku: z.string().min(1, "SKU is required") });
type Values = z.infer<typeof schema>;

function ProductForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { sku: "" } });
  const onSubmit = form.handleSubmit(async (values) => {
    await api.post("/products", values).catch((error: unknown) => applyServerErrors(error, form.setError));
  });
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <InputField<Values> name="sku" label="SKU" />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

describe("InputField", () => {
  it("shows the schema's message on invalid input", async () => {
    renderWithProviders(<ProductForm />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("SKU is required")).toBeInTheDocument();
  });

  it("shows the backend's validation message on the field", async () => {
    server.use(http.post("/api/products", () => validationFailed({ sku: "SKU already taken" })));
    renderWithProviders(<ProductForm />);

    await userEvent.type(screen.getByLabelText("SKU"), "LAMP-1");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("SKU already taken")).toBeInTheDocument();
  });
});
