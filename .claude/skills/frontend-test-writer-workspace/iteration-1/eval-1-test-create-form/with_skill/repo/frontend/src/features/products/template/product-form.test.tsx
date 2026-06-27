import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Tests for the create-product form (features/products/template/product-form.tsx).
 *
 * What's mocked and why:
 * - "@/components/shared/form"  → the real InputField/SelectField are shared pieces
 *   (MODULE_REGISTRY: components/shared/form). We render lightweight, RHF-wired
 *   stand-ins via useFormContext so that real Zod validation, the real submit body,
 *   and accessible <label>/<input> association all behave like the real fields.
 * - "@/hooks/use-auth"          → the real useAuth (registry hook). The form is
 *   admin-only UI (returns null otherwise), so we drive role to test the gate.
 * - "../hooks/use-products"     → the feature mutation hook. We expose a `mutate`
 *   spy + controllable isError/isPending so we can assert the submitted body and
 *   the error/pending UI without a live network or QueryClientProvider.
 */

// Hoisted shared spies/state so the vi.mock factories below can safely reference them.
const h = vi.hoisted(() => ({
  mutate: vi.fn(),
  mutationState: { isError: false, isPending: false },
  authUser: { value: null as null | { role: string } },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: h.authUser.value }),
}));

vi.mock("../hooks/use-products", () => ({
  useCreateProductMutation: () => ({
    mutate: h.mutate,
    isError: h.mutationState.isError,
    isPending: h.mutationState.isPending,
  }),
}));

// Faithful, RHF-aware stand-ins for the shared *Field components (their real
// source files live behind components/shared/form). Number inputs register with
// valueAsNumber so the price reaches the schema as a number, like the real field.
vi.mock("@/components/shared/form", async () => {
  const { useFormContext } = await import("react-hook-form");

  const InputField = ({
    name,
    label,
    type,
  }: {
    name: string;
    label: string;
    type?: string;
  }) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();
    const id = `field-${name}`;
    const err = (errors as Record<string, { message?: string }>)[name];
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type={type ?? "text"}
          {...register(name, type === "number" ? { valueAsNumber: true } : {})}
        />
        {err ? <p role="alert">{String(err.message)}</p> : null}
      </div>
    );
  };

  const SelectField = ({
    name,
    label,
    options,
  }: {
    name: string;
    label: string;
    options: { label: string; value: string }[];
  }) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();
    const id = `field-${name}`;
    const err = (errors as Record<string, { message?: string }>)[name];
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <select id={id} {...register(name)}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {err ? <p role="alert">{String(err.message)}</p> : null}
      </div>
    );
  };

  return {
    InputField,
    SelectField,
    TextareaField: InputField,
    CheckboxField: InputField,
  };
});

// Imported after the mocks so it resolves to the mocked dependencies.
import { ProductForm } from "./product-form";

beforeEach(() => {
  h.mutate.mockReset();
  h.mutationState.isError = false;
  h.mutationState.isPending = false;
  h.authUser.value = { role: "admin" }; // most tests need the form visible
});

describe("ProductForm — auth gating", () => {
  it("renders nothing for an unauthenticated user", () => {
    h.authUser.value = null;
    const { container } = render(<ProductForm />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: /create/i })).not.toBeInTheDocument();
  });

  it("renders nothing for a non-admin user", () => {
    h.authUser.value = { role: "user" };
    render(<ProductForm />);
    expect(screen.queryByRole("button", { name: /create/i })).not.toBeInTheDocument();
  });

  it("renders the form for an admin user", () => {
    render(<ProductForm />);
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });
});

describe("ProductForm — validation", () => {
  it("blocks submit and shows Zod messages on empty input", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/price must be greater than 0/i)).toBeInTheDocument();
    expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    expect(h.mutate).not.toHaveBeenCalled();
  });

  it("rejects a non-positive price", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(screen.getByLabelText(/name/i), "Aero Mug");
    await user.selectOptions(screen.getByLabelText(/category/i), "drinkware");
    // price left at its default of 0
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(await screen.findByText(/price must be greater than 0/i)).toBeInTheDocument();
    expect(h.mutate).not.toHaveBeenCalled();
  });
});

describe("ProductForm — submit", () => {
  it("calls the mutation with the validated body on valid input", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(screen.getByLabelText(/name/i), "Aero Mug");
    const price = screen.getByLabelText(/price/i);
    await user.clear(price);
    await user.type(price, "2400");
    await user.selectOptions(screen.getByLabelText(/category/i), "drinkware");

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(h.mutate).toHaveBeenCalledTimes(1));
    expect(h.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Aero Mug",
        price: 2400, // number, not the "2400" string — field uses valueAsNumber
        category: "drinkware",
        currency: "USD", // schema/RHF default
        inStock: true, // schema/RHF default
      }),
    );
  });
});

describe("ProductForm — mutation state UI", () => {
  it("shows an error alert when the mutation fails", () => {
    h.mutationState.isError = true;
    render(<ProductForm />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/couldn.t create the product/i);
  });

  it("disables the submit button while the mutation is pending", () => {
    h.mutationState.isPending = true;
    render(<ProductForm />);
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });
});
