import "express";
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
      id: string;
      log: Logger;
      // Present only once a cookie parser is mounted (an auth-feature decision).
      cookies?: Record<string, string | undefined>;
    }
  }
}

export {};
