import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import { requestContext } from "./middleware/request-context.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";
import healthRoutes from "./modules/health/health.routes.js";

// Builds and configures the app but does NOT listen — server.ts owns the
// lifecycle. This keeps the app importable for tests.
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(pinoHttp({ logger }));
  app.use(requestContext);
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  // --- Module routes: backend-module-builder mounts new routers below this line ---
  app.use("/health", healthRoutes);
  // --- End module routes ---

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
