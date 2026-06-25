import type { RequestHandler } from "express";
import * as z from "zod";
import { BadRequestError } from "../lib/app-error.js";

interface ValidateSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

// Factory: parse the named request parts with Zod, throw BadRequestError with a
// treeified error on failure, and assign the parsed/typed values back onto req.
// Controllers downstream consume already-validated input and never re-validate.
export function validate(schemas: ValidateSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError("Validation failed", z.treeifyError(result.error));
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw new BadRequestError("Validation failed", z.treeifyError(result.error));
      }
      req.params = result.data as typeof req.params;
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
