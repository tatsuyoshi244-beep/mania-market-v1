import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";
import { requireEnv } from "@/lib/env";

const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET ?? requireEnv("DATABASE_URL");

export const neonAuth = createNeonAuth({
  baseUrl: requireEnv("NEON_AUTH_BASE_URL"),
  cookies: { secret: cookieSecret, sessionDataTtl: 300 },
  logLevel: process.env.NODE_ENV === "production" ? "error" : "warn"
});
