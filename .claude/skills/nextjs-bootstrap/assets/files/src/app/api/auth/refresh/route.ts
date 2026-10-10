import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import * as z from "zod";

import { envelopeSchema } from "@/lib/api/envelope";
import { clearSession, setSession } from "@/lib/auth/session";
import { REFRESH_COOKIE } from "@/lib/auth/tokens";
import { backendUrl, bffError, upstreamHeaders } from "@/lib/bff";

/**
 * Refresh handler (default rotation ON). Called by the axios interceptor on a
 * 401. Uses the httpOnly refresh cookie to mint a new access token via the
 * backend, then rotates the cookies server-side. If refresh fails, the session
 * is cleared so the next navigation lands on /login.
 *
 * If you chose "no refresh rotation" at scaffold time, delete this route and the
 * interceptor block in lib/axios.ts.
 */

// The backend's refresh `data`. Adjust to the auth module's actual contract.
const refreshResponseSchema = envelopeSchema(
  z.object({ accessToken: z.string().min(1), refreshToken: z.string().min(1).optional() }),
);

export async function POST(request: NextRequest) {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return bffError(401, "UNAUTHORIZED", "No refresh token.");

  let backendResponse: Response;
  try {
    const headers = upstreamHeaders(request);
    headers.set("content-type", "application/json");
    backendResponse = await fetch(backendUrl("auth/refresh"), {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return bffError(502, "BAD_GATEWAY", "The API is unreachable.");
  }

  const parsed = refreshResponseSchema.safeParse(await backendResponse.json().catch(() => null));
  if (!backendResponse.ok || !parsed.success) {
    await clearSession();
    return bffError(401, "UNAUTHORIZED", "Session expired. Please sign in again.");
  }

  const { accessToken, refreshToken: rotated } = parsed.data.data;
  await setSession({ accessToken, refreshToken: rotated ?? refreshToken });
  return NextResponse.json({ success: true, data: { refreshed: true } });
}
