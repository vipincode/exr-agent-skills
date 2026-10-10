import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import * as z from "zod";

// One way to turn anything an API call throws into something the UI can show,
// and to push the backend's validation errors onto form fields. Matches the
// backend's error envelope: { success: false, error: { code, message, details? } }.

const errorBodySchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});

/** A normalized API failure. `status` is 0 when no HTTP response exists. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/** Normalize an axios error, a contract (Zod) error, or anything else into an `ApiError`. */
export function toApiError(err: unknown): ApiError {
  if (isAxiosError(err)) {
    if (!err.response) {
      return { status: 0, code: "NETWORK", message: "Can't reach the server. Check your connection." };
    }
    const body = errorBodySchema.safeParse(err.response.data);
    if (body.success) return { status: err.response.status, ...body.data.error };
    return { status: err.response.status, code: "UNKNOWN", message: err.message };
  }
  if (err instanceof z.ZodError) {
    // The response didn't match the schema: the frontend and backend contracts drifted.
    return { status: 0, code: "CONTRACT", message: "The server sent an unexpected response.", details: z.treeifyError(err) };
  }
  return { status: 0, code: "UNKNOWN", message: err instanceof Error ? err.message : "Something went wrong." };
}

interface ErrorTree {
  errors?: string[];
  properties?: Record<string, ErrorTree>;
  items?: (ErrorTree | undefined)[];
}

/**
 * Field → first message from a validation error's `details`. Understands both
 * backend shapes: `z.treeifyError` (400 from `validate`) and a flat
 * `{ path: message }` record (422 from Mongoose). Nested paths become "a.b" / "items.0".
 */
export function fieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!details || typeof details !== "object") return out;

  const tree = details as ErrorTree;
  if (tree.properties || tree.items) {
    const walk = (node: ErrorTree | undefined, path: string) => {
      if (!node) return;
      if (path && node.errors?.[0]) out[path] ??= node.errors[0];
      for (const [key, child] of Object.entries(node.properties ?? {})) walk(child, path ? `${path}.${key}` : key);
      node.items?.forEach((child, i) => walk(child, path ? `${path}.${i}` : String(i)));
    };
    walk(tree, "");
    return out;
  }

  for (const [key, value] of Object.entries(details)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * Put server-side validation errors on the matching React Hook Form fields.
 * Returns true if at least one field was set — otherwise show `toApiError(err).message`.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): boolean {
  const fields = fieldErrors(toApiError(err).details);
  for (const [name, message] of Object.entries(fields)) {
    setError(name as Path<T>, { type: "server", message });
  }
  return Object.keys(fields).length > 0;
}
