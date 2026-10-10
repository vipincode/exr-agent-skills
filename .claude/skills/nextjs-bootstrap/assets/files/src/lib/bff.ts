import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

// Server-side helpers shared by the BFF Route Handlers under app/api/.

// Hop-by-hop and host-specific headers that must not be forwarded upstream.
const DROP_HEADERS = ["host", "connection", "content-length", "keep-alive", "transfer-encoding", "upgrade"];

/**
 * The backend URL for a path. BACKEND_URL already includes the API prefix
 * (e.g. http://localhost:4000/api/v1), so callers pass "auth/login", not "/api/v1/auth/login".
 */
export function backendUrl(path: string, search = ""): string {
  return `${env.BACKEND_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}${search}`;
}

/**
 * Headers for an upstream call: the caller's headers minus hop-by-hop ones,
 * plus the access token and an `x-request-id` (kept if the client sent one) so a
 * request can be traced across BFF and backend logs. `x-forwarded-for` is kept,
 * so a backend with TRUST_PROXY=1 rate-limits per real client instead of per BFF.
 */
export function upstreamHeaders(request: NextRequest, accessToken?: string): Headers {
  const headers = new Headers(request.headers);
  for (const name of DROP_HEADERS) headers.delete(name);
  if (!headers.has("x-request-id")) headers.set("x-request-id", randomUUID());
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  return headers;
}

/** An error in the backend's envelope shape, for failures that originate in the BFF itself. */
export function bffError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
