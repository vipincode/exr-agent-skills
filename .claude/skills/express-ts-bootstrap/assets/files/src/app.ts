import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { requestContext } from "./middleware/request-context.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes.js";

export const API_PREFIX = "/api/v1";

// Builds and configures the app but does NOT listen — server.ts owns the
// lifecycle. This keeps the app importable for tests (supertest).
// Feature modules are mounted in routes.ts, never here.
export function createApp() {
  const app = express();

  // Behind the BFF / a load balancer, trust that many X-Forwarded-For hops so
  // req.ip (and therefore the rate limiter) sees the real client, not the proxy.
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));
  app.use(requestContext);
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.use(API_PREFIX, apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
