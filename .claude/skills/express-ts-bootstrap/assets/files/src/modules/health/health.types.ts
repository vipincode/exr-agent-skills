export interface HealthStatus {
  status: "ok";
  uptime: number;
  timestamp: string;
  db: "connected" | "disconnected";
}
