import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Tests for the admin "create product" form.
 *
 * Mocking strategy (pure component test — no network, no QueryClient):
 *  - `@/components/shared/form`  -> lightweight field components wired to the REAL
 *     react-hook-form context, so RHF + zodResolver validation runs for real.
 *     (The concrete *Field implementations are out of scope here and are only
 *      re-exported barrels, so we stub them to native <input>/<select>.)
 *  - `@/hooks/use-auth`          -> controls the current user's role (admin gate).
 *  - `../hooks/use-products`     -> stubs useCreateProductMutation so we can assert
 *     what gets submitted and drive isPending / isError without TanStack Query.
 */

// Mutable, hoisted state shared between the module mocks and each test.
const h = vi.hoisted(() => ({
  mutation: {
    mutate: vi.fn(),
    isError: false,
    isPending: false,
  },
  auth: {
    user: null as null | { role: string },
  },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => h.auth,
}));

vi.mock("../hooks/use-products", () => ({
  useCreateProductMutation: () => h.mutation,
}));

vi.mock("@/components/shared/form", async () => {
  const { useFormContext } = await import("react-hook-form");

  function InputField({
    name,
    label,
    type,
  }: {
    name: string;
    label: string;
    type?: string;
  }) {
    const { register } = useFormContext();
    return (
      <label>
        {label}
        <input
          aria-label={label}
          type={type ?? "text"}
          {...register(name, { valueAsNumber: type === "number" })}
        />
      </label>
    );
  }

  function SelectField({
    name,
    label,
    options,
  }: {
    name: string;
    label: string;
    options: { label: string; value: string }[];
  }) {
    const { register } = useFormContext();
    return (
      <label>
        {label}
        <select aria-label={label} {...register(name)}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return {
    InputField,
    SelectField,
    TextareaField: () => null,
    CheckboxField: () => null,
  };
});

// Import AFTER the mocks are registered.
import { ProductForm } from "./product-form";

beforeEach(() => {
  h.mutation.mutate = vi.fn();
  h.mutation.isError = false;
  h.mutation.isPending = false;
  h.auth.user = { role: "admin" };
});

describe("ProductForm — admin gating", () => {
  it("renders nothing for a non-admin (null) user", () => {
    h.auth.user = null;
    const { container } = render(<ProductForm />);
    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole("button", { name: /create/i })
    ).not.toBeInTheDocument();
  });

  it("renders nothing for a logged-in non-admin user", () => {
    h.auth.user = { role: "customer" };
    const { container } = render(<ProductForm />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the form for an admin user", () => {
    render(<ProductForm />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Price (cents)")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create/i })
    ).toBeInTheDocument();
  });
});

describe("ProductForm — submission", () => {
  it("submits valid values (merged with schema defaults) to the mutation", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(screen.getByLabelText("Name"), "Cold Brew Mug");
    await user.type(screen.getByLabelText("Price (cents)"), "1500");
    await user.selectOptions(screen.getByLabelText("Category"), "drinkware");

    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(h.mutation.mutate).toHaveBeenCalledTimes(1));
    expect(h.mutation.mutate).toHaveBeenCalledWith({
      name: "Cold Brew Mug",
      price: 1500,
      currency: "USD", // default from createProductSchema / form defaults
      category: "drinkware",
      inStock: true, // default
    });
  });

  it("coerces the price field to a number", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(screen.getByLabelText("Name"), "Tumbler");
    await user.type(screen.getByLabelText("Price (cents)"), "999");
    await user.selectOptions(screen.getByLabelText("Category"), "drinkware");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => expect(h.mutation.mutate).toHaveBeenCalledTimes(1));
    const submitted = h.mutation.mutate.mock.calls[0][0];
    expect(submitted.price).toBe(999);
    expect(typeof submitted.price).toBe("number");
  });
});

describe("ProductForm — validation blocks submit", () => {
  it("does not call the mutation when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    // Name empty, price defaults to 0 (not positive), category empty -> invalid.
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Give RHF/zodResolver a tick to resolve validation.
    await new Promise((r) => setTimeout(r, 0));
    expect(h.mutation.mutate).not.toHaveBeenCalled();
  });

  it("does not submit when only the name is filled (price must be > 0)", async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    await user.type(screen.getByLabelText("Name"), "Incomplete");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await new Promise((r) => setTimeout(r, 0));
    expect(h.mutation.mutate).not.toHaveBeenCalled();
  });
});

describe("ProductForm — mutation states", () => {
  it("shows an error alert when the mutation has errored", () => {
    h.mutation.isError = true;
    render(<ProductForm />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/couldn.t create the product/i);
  });

  it("does not show the error alert in the idle state", () => {
    render(<ProductForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("disables the Create button while the mutation is pending", () => {
    h.mutation.isPending = true;
    render(<ProductForm />);
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled();
  });

  it("enables the Create button when not pending", () => {
    render(<ProductForm />);
    expect(
      screen.getByRole("button", { name: /create/i })
    ).toBeEnabled();
  });
});
