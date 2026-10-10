import { Router } from "express";
import { healthRoutes } from "./modules/health/index.js";

// The route registry — the ONE shared file a new module touches. Each module
// adds a single mount line here, importing its router from the module's public
// index.js. app.ts mounts this whole router under /api/v1 and is never edited
// for a feature.
export const apiRouter = Router();

// --- Module routes: one line per module, alphabetical. module-builder appends here. ---
apiRouter.use("/health", healthRoutes);
// --- End module routes ---
