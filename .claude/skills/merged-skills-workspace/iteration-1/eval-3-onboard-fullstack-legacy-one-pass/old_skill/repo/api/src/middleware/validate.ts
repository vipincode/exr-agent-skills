import { Schema } from "joi";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export const validateBody =
  (schema: Schema) => (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) return next(new ApiError(422, error.message));
    req.body = value;
    next();
  };
