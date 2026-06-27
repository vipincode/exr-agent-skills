# Architecture — demo-api (backend)

## Stack
Express 5 + TypeScript (NodeNext, `.js` import extensions) + Mongoose + Zod + JOSE.

## Response envelope (fixed)
Every success response uses the shared helpers in `src/lib/app-response.ts`:
- `ok(res, data, message?)`     → 200 `{ "success": true, "data": <data>, "message": <string> }`
- `created(res, data, message?)`→ 201 same envelope
- `noContent(res)`              → 204 (no body)

Errors are thrown as `AppError` subclasses and serialized by the error middleware as:
`{ "success": false, "message": <string>, "code": <string> }` with the matching HTTP status
(NotFoundError→404, ConflictError→409, UnauthorizedError→401, ValidationError→422).

## Auth primitives
- `protect` — requires a valid access token (Bearer). Attaches `req.user`.
- `requireRole('admin')` — must run after `protect`.

## Validation
`validate({ body?, query?, params? })` middleware with Zod schemas; controllers read typed input.
