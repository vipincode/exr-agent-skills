import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/session";

/**
 * BFF proxy — the ONLY thing that talks to the backend.
 *
 * The browser calls same-origin `/api/<path>`; this handler forwards it to
 * `BACKEND_URL/<path>`, attaching the access token from the httpOnly cookie as
 * a Bearer header (strategy a/b). The backend URL and the token never reach the
 * browser. Auth-specific routes (`/api/auth/login`, `/api/auth/refresh`) have
 * their own handlers that win over this catch-all.
 */
async function proxy(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const search = request.nextUrl.search;
  const target = `${env.BACKEND_URL}/${path.join("/")}${search}`;

  const session = await getSession();

  // Copy incoming headers, drop hop-by-hop / host ones, add auth.
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  if (session?.accessToken) {
    headers.set("authorization", `Bearer ${session.accessToken}`);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);

  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    // @ts-expect-error -- Node fetch needs duplex for streamed request bodies
    duplex: hasBody ? "half" : undefined,
  });

  // Pass the backend response straight back to the browser.
  const responseHeaders = new Headers(backendResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
