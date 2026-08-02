"use client";

// STOPGAP DESIGN — the slice flagged that no register-form design exists yet.
// This is a minimal shared-*Field form so the binding is usable; it is NOT a designed
// screen. Replace it via figma-to-component / html-to-component when the design lands.

import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { InputField } from "@/components/shared/form";
import { Button } from "@/components/ui/button";
import { useRegisterMutation } from "../hooks/use-register";
import { registerRequestSchema, type RegisterRequest } from "../schema/register.schema";
import { POST_AUTH_REDIRECT } from "../constants/auth";

const CONFLICT_STATUS = 409;

function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as
      | { message?: string; error?: { message?: string } }
      | undefined;
    return body?.message ?? body?.error?.message ?? fallback;
  }
  return fallback;
}

export function RegisterForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useRegisterMutation();

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync(values);
      router.push(POST_AUTH_REDIRECT);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === CONFLICT_STATUS) {
        form.setError("email", {
          message: errorMessage(error, "Email already registered"),
        });
        return;
      }
      form.setError("root", { message: errorMessage(error, "Could not create your account.") });
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4" noValidate>
        <InputField name="name" label="Name" autoComplete="name" />
        <InputField name="email" label="Email" type="email" autoComplete="email" />
        <InputField name="password" label="Password" type="password" autoComplete="new-password" />

        {form.formState.errors.root ? (
          <p role="alert" className="text-sm text-red-500">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </FormProvider>
  );
}
