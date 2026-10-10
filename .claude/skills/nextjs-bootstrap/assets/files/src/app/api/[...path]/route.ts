import { type NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { backendUrl, bffError, upstreamHeaders } from "@/lib/bff";

/**
 * BFF proxy — the ONLY thing that talks to the backend.
 *
 * The browser calls same-origin `/api/<path>`; this handler forwards it to
 * `BACKEND_URL/<path>` (BACKEND_URL includes the backend's `/api/v1` prefix),
 * attaching the access token from the httpOnly cookie as a Bearer header. The
 * backend URL and the token never reach the browser. Auth-specific routes
 * (`/api/auth/login`, `/api/auth/refresh`) have their own handlers that win
 * over this catch-all.
 */
async function proxy(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const session = await getSession();
  const hasBody = !["GET", "HEAD"].includes(request.method);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(backendUrl(path.join("/"), request.nextUrl.search), {
      method: request.method,
      headers: upstreamHeaders(request, session?.accessToken),
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    return bffError(502, "BAD_GATEWAY", "The API is unreachable.");
  }

  // Pass the backend response (already in the shared envelope) straight back.
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
