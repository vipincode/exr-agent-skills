import mongoose from "mongoose";

export interface HealthStatus {
  status: "ok";
  uptime: number;
  timestamp: string;
  db: "connected" | "disconnected";
}

// The canonical functional module the other skills imitate: a plain exported
// function, no class, no `this`. Returns data; the controller wraps it.
export function getHealth(): HealthStatus {
  return {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  };
}
