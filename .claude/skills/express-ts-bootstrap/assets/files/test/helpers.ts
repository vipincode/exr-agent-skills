import request from "supertest";
import { createApp } from "../src/app.js";
import { signAccessToken } from "../src/lib/jwt.js";

// Shared test helpers. Reuse these instead of re-creating an app or
// hand-crafting a JWT in each test file.

/** A supertest agent over a fresh app instance. */
export function api() {
  return request(createApp());
}

/** An Authorization header carrying a real token minted by the app's own signer. */
export async function authHeader(
  role = "user",
  sub = "000000000000000000000001",
): Promise<{ Authorization: string }> {
  return { Authorization: `Bearer ${await signAccessToken({ sub, role })}` };
}
