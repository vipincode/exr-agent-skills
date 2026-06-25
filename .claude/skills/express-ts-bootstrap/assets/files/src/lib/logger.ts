import { pino } from "pino";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV === "development";

// pretty, colorized output in dev; structured JSON in prod.
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});
