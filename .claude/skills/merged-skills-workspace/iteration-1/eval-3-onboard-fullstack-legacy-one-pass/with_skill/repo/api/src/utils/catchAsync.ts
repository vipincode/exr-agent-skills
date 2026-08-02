import { Request, Response, NextFunction } from "express";

// Express 4 does not forward async rejections, so every async handler is wrapped.
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
