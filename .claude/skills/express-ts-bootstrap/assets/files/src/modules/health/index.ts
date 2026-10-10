// Public surface of the health module. Other code (src/routes.ts, other
// modules) imports from this file only — never from the files behind it.

export { default as healthRoutes } from "./health.routes.js";
export { getHealth } from "./health.service.js";
export type { HealthStatus } from "./health.types.js";
