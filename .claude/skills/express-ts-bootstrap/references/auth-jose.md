# Auth primitives (JOSE) — utilities only, NOT endpoints

The bootstrap ships JOSE token helpers and auth middleware so that when module-planner designs the auth feature, module-builder reuses these instead of reinventing them. **This skill does not create login/register/refresh routes.** It installs the primitives and registers them. The files in `assets/files/` are the source of truth; the excerpts below explain them. JOSE 6 is ESM-first and keeps the v5 `SignJWT`/`jwtVerify` API.

## `lib/jwt.ts` — sign & verify

HS256 with a secret from `env` is the default (symmetric, simplest, fine for a single service). Document in ARCHITECTURE.md that switching to RS256/EdDSA means swapping the key import here and nowhere else.

```ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessClaims extends JWTPayload {
  sub: string;  // user id
  role: string; // single role; widen to string[] if RBAC needs it
}

export async function signAccessToken(claims: { sub: string; role: string }) {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL) // e.g. "15m"
    .sign(secret);
}

export async function signRefreshToken(claims: { sub: string }) { /* same, typ: "refresh", REFRESH_TOKEN_TTL */ }

export async function verifyToken<T extends JWTPayload = AccessClaims>(token: string): Promise<T> {
  const { payload } = await jwtVerify<T>(token, secret);
  return payload;
}
```

## `middleware/protect.ts` — auth guard + `getAuthUser`

Reads the bearer token (and `req.cookies.access_token` once a feature mounts a cookie parser), verifies it, attaches `req.user`. **Any** verification failure — missing, expired, bad signature, garbage — is a 401 `UNAUTHORIZED`, never a 500: JOSE's errors are not `AppError`s, so `protect` maps them explicitly. Cookie-vs-bearer is a *feature decision* recorded later; the guard supports both so the auth feature can choose without editing it.

```ts
export async function protect(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = bearer ?? req.cookies?.access_token;
  if (!token) throw new UnauthorizedError("Authentication required");

  const claims = await verifyToken(token).catch(() => {
    throw new UnauthorizedError("Invalid or expired token");
  });
  req.user = { id: claims.sub, role: claims.role };
  next();
}

// In controllers on protected routes — instead of `req.user!`.
export function getAuthUser(req: Pick<Request, "user">): { id: string; role: string } {
  if (!req.user) throw new UnauthorizedError("Authentication required");
  return req.user;
}
```

## `middleware/require-role.ts` — RBAC gate

```ts
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  };
}
```

## Express type augmentation (`types/express.d.ts`)

Adds `req.user`, `req.id`, `req.log`, and an optional `req.cookies` (typed so the guard needs no `any` cast).

## Testing auth

`test/helpers.ts` exports `authHeader(role, sub?)`, which mints a real token with `signAccessToken`. Integration tests assert 401 without a token, 401 with a garbage token, and 403 with the wrong role — never hand-craft a JWT.

## Registry entries the bootstrap must write

Seed MODULE_REGISTRY.md with: `signAccessToken`/`signRefreshToken`/`verifyToken` (lib/jwt.ts), `protect` + `getAuthUser` (middleware/protect.ts), `requireRole` (middleware/require-role.ts). State plainly that **auth endpoints do not exist yet** so module-planner knows to build them and module-builder knows to wire them onto these existing primitives — not to write new token logic.

Env vars in the schema and `.env.example`: `JWT_SECRET` (≥ 32 chars), `ACCESS_TOKEN_TTL` (default `15m`), `REFRESH_TOKEN_TTL` (default `7d`).
