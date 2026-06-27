# Shared form fields

The `components/shared/form/*Field` components are the **single definition of field UI** in the app.
They exist so forms stay consistent and so later skills compose forms by importing fields, never by
re-wiring `Controller` + a raw input. Read this before overlaying `components/shared/form/`.

## The pattern (every field follows it)

> **Important — modern shadcn.** Current shadcn ships a form-library-agnostic **`Field`** primitive
> (`Field` / `FieldLabel` / `FieldDescription` / `FieldError` / `FieldContent`). The old RHF-bound
> `Form` / `FormField` component is **gone**. So our fields bind React Hook Form themselves with
> `useController` and render through the `Field` primitive. If you remember the `<Form>`/`FormField`
> API, it no longer exists — confirm via context7.

Each field is a thin wrapper that:
1. Calls `useController({ name, control })` to bind React Hook Form (reads `control` from
   `useFormContext` when not passed — so inside a `FormProvider` you write just
   `<InputField name="email" label="Email" />`).
2. Renders the shared `FieldShell` (from `field-base.tsx`) which lays out `FieldLabel` → control →
   `FieldDescription` → `FieldError`. Horizontal boolean fields (checkbox/switch) compose the
   primitive directly since their control comes before the label.
3. Drops the matching `ui/` primitive in, bound to the controller's `field`.
4. Takes `cva` variants via `field-base.tsx` (`fieldControlVariants.size` adjusts control density;
   because shadcn uses `cva`, our fields do too) and a pass-through `orientation`.

`field-base.tsx` holds the shared bits (DRY): `FieldShell`, `fieldControlVariants`, `BaseFieldProps`,
`FieldOption`, `FieldOrientation`. Add a new shared prop, size, or layout tweak there, not per-field.

## Forms wrap fields in a `FormProvider`

Because the fields read `control` from context, the form wraps them in RHF's `FormProvider` (not a
shadcn `<Form>`, which no longer exists):

```tsx
import { useForm, FormProvider } from "react-hook-form";
// …
const form = useForm({ resolver: zodResolver(schema), defaultValues });
return (
  <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>{/* <InputField …/> etc. */}</form>
  </FormProvider>
);
```

## The fields and the `ui` primitive each needs

| Field | `ui` primitive(s) | Stored value |
| --- | --- | --- |
| `InputField` | `input` | string/number |
| `TextareaField` | `textarea` | string |
| `SelectField` | `select` | string |
| `MultiSelectField` | `popover` + `command` + `badge` + `button` | string[] |
| `ComboboxField` | `popover` + `command` + `button` | string |
| `RadioField` | `radio-group` + `field` | string |
| `CheckboxField` | `checkbox` + `field` | boolean |
| `SwitchField` | `switch` + `field` | boolean |
| `DateField` | `popover` + `calendar` + `button` | Date |
| `UploadFileField` | `input[type=file]` | File / File[] |

Every field also uses the `field` primitive for layout. So `shadcn add` must include: `field input
textarea select checkbox radio-group switch popover command calendar badge button label`. If a field
fails to compile with a "module not found `@/components/ui/...`" error, the cause is a missing
primitive — add it and re-check.

## Usage example (what later skills generate)

```tsx
"use client";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { InputField, SelectField, CheckboxField } from "@/components/shared/form";

const schema = z.object({
  email: z.email(),
  role: z.enum(["admin", "user"]),
  agree: z.boolean().refine((v) => v, "Required"),
});

export function ExampleForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "user", agree: false },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((values) => console.log(values))}>
        <FieldGroup>
          <InputField name="email" label="Email" type="email" required />
          <SelectField
            name="role"
            label="Role"
            options={[
              { label: "Admin", value: "admin" },
              { label: "User", value: "user" },
            ]}
          />
          <CheckboxField name="agree" label="I agree to the terms" required />
          <Button type="submit">Submit</Button>
        </FieldGroup>
      </form>
    </FormProvider>
  );
}
```

(`FieldGroup` from `ui/field` gives consistent vertical spacing between fields.)

## Adding a new field type

If a form needs a field that doesn't exist yet (e.g. an OTP input, a slider), build it here following
the same pattern, export it from `index.ts`, and add a row to `MODULE_REGISTRY.md`. Don't inline a
one-off field in a page.
