import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { setSession } from "@/lib/auth/session";

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
export async function POST(request: NextRequest) {
  const credentials = await request.json();

  const backendResponse = await fetch(`${env.BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  // Adjust these property paths to match your backend's login response shape.
  const accessToken: string | undefined = data.accessToken ?? data.data?.accessToken;
  const refreshToken: string | undefined =
    data.refreshToken ?? data.data?.refreshToken;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Login response did not include an access token" },
      { status: 502 },
    );
  }

  await setSession({ accessToken, refreshToken });

  // Return the user, not the tokens — the cookies carry auth from here on.
  return NextResponse.json({ user: data.user ?? data.data?.user ?? null });
}
