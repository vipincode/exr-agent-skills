import type { Request, RequestHandler } from "express";
import * as z from "zod";
import { BadRequestError } from "../lib/app-error.js";

/**
 * The parts of a request a route validates. Each module's `<name>.schema.ts`
 * exports one of these per route, e.g.
 *   export const getProductRequest = { params: idParamsSchema } satisfies RequestSchemas;
 * The same object feeds `validate(...)` in routes and `ValidatedRequest<...>` in
 * the controller, so the runtime check and the compile-time type cannot drift.
 */
export interface RequestSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

type Parsed<S extends RequestSchemas, K extends keyof RequestSchemas, Fallback> =
  S[K] extends z.ZodType ? z.output<S[K]> : Fallback;

type ParamsOf<S extends RequestSchemas> = Parsed<S, "params", Request["params"]>;
type BodyOf<S extends RequestSchemas> = Parsed<S, "body", unknown>;
type QueryOf<S extends RequestSchemas> = Parsed<S, "query", Request["query"]>;

/**
 * A request whose params/body/query have already passed `validate(schemas)`.
 * Controllers type their `req` with this — never `req.body as X`.
 *   export async function getOne(req: ValidatedRequest<typeof getProductRequest>, res: Response)
 */
export type ValidatedRequest<S extends RequestSchemas> = Request<
  ParamsOf<S>,
  unknown,
  BodyOf<S>,
  QueryOf<S>
>;

// Factory: parse the named request parts with Zod, throw BadRequestError with a
// treeified error on failure, and assign the parsed/typed values back onto req.
// Controllers downstream consume already-validated input and never re-validate.
export function validate<S extends RequestSchemas>(
  schemas: S,
): RequestHandler<ParamsOf<S>, unknown, BodyOf<S>, QueryOf<S>> {
  return (req, _res, next) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError("Validation failed", z.treeifyError(result.error));
      }
      req.body = result.data as BodyOf<S>;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw new BadRequestError("Validation failed", z.treeifyError(result.error));
      }
      req.params = result.data as ParamsOf<S>;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw new BadRequestError("Validation failed", z.treeifyError(result.error));
      }
      // Express 5 exposes req.query through a getter with no setter, so a plain
      // assignment throws. Redefine it as a data property holding validated data.
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }

    next();
  };
}
