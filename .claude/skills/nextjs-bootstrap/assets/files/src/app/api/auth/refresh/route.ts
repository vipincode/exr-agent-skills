import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { setSession, clearSession } from "@/lib/auth/session";
import { REFRESH_COOKIE } from "@/lib/auth/tokens";

/**
 * Refresh handler (default rotation ON). Called by the axios interceptor on a
 * 401. Uses the httpOnly refresh cookie to mint a new access token via the
 * backend, then rotates the cookies server-side. If refresh fails, the session
 * is cleared so the next navigation lands on /login.
 *
 * If you chose "no refresh rotation" at scaffold time, delete this route and the
 * interceptor block in lib/axios.ts.
 */
export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const backendResponse = await fetch(`${env.BACKEND_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await backendResponse.json().catch(() => ({}));

  if (!backendResponse.ok) {
    await clearSession();
    return NextResponse.json(data, { status: 401 });
  }

  const accessToken: string | undefined = data.accessToken ?? data.data?.accessToken;
  const newRefresh: string | undefined =
    data.refreshToken ?? data.data?.refreshToken ?? refreshToken;

  if (!accessToken) {
    await clearSession();
    return NextResponse.json({ error: "No access token in refresh" }, { status: 401 });
  }

  await setSession({ accessToken, refreshToken: newRefresh });
  return NextResponse.json({ ok: true });
}
