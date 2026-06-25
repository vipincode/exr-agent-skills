import "express";
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      id: string;
      log: Logger;
    }
  }
}

export {};
