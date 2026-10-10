import { HttpResponse } from "msw";
import { setupServer } from "msw/node";

import type { PageMeta } from "@/lib/api/envelope";

// The shared MSW server plus response builders that produce the backend's EXACT
// envelope (express-ts-bootstrap), so mocked responses can't drift from the real
// contract. Tests add handlers per case with `server.use(...)`, e.g.
//   server.use(http.get("/api/products", () => okPage([product], { page: 1, limit: 20, total: 1, totalPages: 1 })));

/** The MSW server started in test/setup.ts; add handlers per test with `server.use(...)`. */
export const server = setupServer();

/** `200 { success: true, data }` — a single-resource success. */
export function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, data }, { status });
}

/** `200 { success: true, data: [...], meta }` — a paginated list. */
export function okPage<T>(items: T[], meta: PageMeta) {
  return HttpResponse.json({ success: true, data: items, meta });
}

/** `{ success: false, error: { code, message, details? } }` with the given status. */
export function fail(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    { success: false, error: { code, message, ...(details === undefined ? {} : { details }) } },
    { status },
  );
}

/** A 400 validation failure shaped like the backend's `z.treeifyError` details. */
export function validationFailed(fields: Record<string, string>) {
  const properties = Object.fromEntries(Object.entries(fields).map(([k, m]) => [k, { errors: [m] }]));
  return fail(400, "BAD_REQUEST", "Validation failed", { errors: [], properties });
}
