# Module anatomy

What each file in `src/modules/<name>/` should contain. Authoring style (functions vs classes) follows the paradigm in ARCHITECTURE.md — read its paradigm section and match it. The import-extension convention also comes from ARCHITECTURE.md (bootstrap default: NodeNext `.js`).

## `<name>.model.ts` — only if the module owns data
Mongoose schema + model. PascalCase singular model name. Declare indexes here (unique, compound). Keep it pure data shape; no business logic.

## `<name>.schema.ts` — Zod input/output schemas
Zod 4: `import * as z from "zod"`, top-level formats (`z.email()`, `z.uuid()`). One schema per operation (`createXSchema`, `updateXSchema`, query/param schemas). Export inferred types via `z.infer` so the rest of the module has one source of truth for shapes.

## `<name>.service.ts` — business logic
Owns all data access and rules for this module. Throws shared `AppError` subclasses (`NotFoundError`, `ConflictError`, …). Calls other modules through *their* services, never their models. Functional (exported functions) or class (constructor-injected) per the paradigm. No `req`/`res` here — services are transport-agnostic and testable in isolation.

## `<name>.controller.ts` — thin HTTP layer
Maps request → service call → response envelope. Receives already-validated, typed input. Sends success only via `ok`/`created`/`noContent`. **No try/catch** (Express 5 forwards rejections). No business logic.

## `<name>.routes.ts` — wiring
An `express.Router`, default-exported. Each route: `validate({...})` (if it takes input) → auth guard (`protect`/`requireRole`) where needed → controller handler. Compose service/controller instances here if the paradigm uses classes. Mount this router in `src/app.ts` at the marked insertion line.

## `<name>.types.ts` — optional
Module-local types not derived from Zod. If a type is needed by other modules, it's not module-local — register it / put it in a shared location instead.

## Ordering on a route
`router.<method>(path, validate(...), protect?, requireRole(...)?, controller.handler)` — validation first (reject malformed input cheaply), then auth, then handler.
