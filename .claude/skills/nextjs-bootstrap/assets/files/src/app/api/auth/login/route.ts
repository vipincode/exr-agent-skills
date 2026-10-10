import { type NextRequest, NextResponse } from "next/server";
import * as z from "zod";

import { envelopeSchema } from "@/lib/api/envelope";
import { setSession } from "@/lib/auth/session";
import { backendUrl, bffError, upstreamHeaders } from "@/lib/bff";

/**
 * Login handler — STRATEGY (a): backend returns tokens in the body, we set the
 * httpOnly cookies. The browser POSTs credentials to same-origin
 * `/api/auth/login`; the backend URL and tokens never touch client JS.
 *
 * Other strategies (see references/auth-bff.md):
 *   (b) backend sets cookies → forward `set-cookie` instead of calling setSession.
 *   (c) header/client-stored → return the access token in the body for the client
 *       to keep; do NOT set cookies here.
 */

// The backend's login `data`. Adjust to the auth module's actual contract
// (the slice file's API contract section) — a mismatch fails loudly with 502.
const loginResponseSchema = envelopeSchema(
  z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1).optional(),
    user: z.unknown().optional(),
  }),
);

export async function POST(request: NextRequest) {
  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl("auth/login"), {
      method: "POST",
      headers: upstreamHeaders(request),
      body: await request.text(),
    });
  } catch {
    return bffError(502, "BAD_GATEWAY", "The API is unreachable.");
  }

  const body: unknown = await backendResponse.json().catch(() => null);

  // Backend errors are already in the shared error envelope — pass them through.
  if (!backendResponse.ok) {
    return body
      ? NextResponse.json(body, { status: backendResponse.status })
      : bffError(backendResponse.status, "UPSTREAM_ERROR", "Login failed.");
  }

  const parsed = loginResponseSchema.safeParse(body);
  if (!parsed.success) {
    return bffError(502, "CONTRACT", "Login response did not match the expected shape.");
  }

  const { accessToken, refreshToken, user } = parsed.data.data;
  await setSession({ accessToken, refreshToken });

  // Return the user, not the tokens — the httpOnly cookies carry auth from here on.
  return NextResponse.json({ success: true, data: { user: user ?? null } });
}
