import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";
export const env = createEnv({
  server: { BACKEND_URL: z.url() },
  client: {},
  experimental__runtimeEnv: {},
});
