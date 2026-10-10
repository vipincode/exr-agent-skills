import mongoose from "mongoose";
import type { HealthStatus } from "./health.types.js";

// The canonical functional module the other skills imitate: a plain exported
// function, no class, no `this`. Returns data; the controller wraps it.
// (health owns no model, so it has no repository or mapper — a data-owning
// module adds <name>.model.ts / .repository.ts / .mapper.ts; see ARCHITECTURE.md.)

/** Liveness/readiness snapshot: uptime, timestamp, and database connection state. */
export function getHealth(): HealthStatus {
  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === mongoose.ConnectionStates.connected ? "connected" : "disconnected",
  };
}
