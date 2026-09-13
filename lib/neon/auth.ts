import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { requireEnv } from "@/lib/env";

let auth: NeonAuth | null = null;

export function getNeonAuth() {
  if (auth) return auth;

  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET ?? requireEnv("DATABASE_URL");
  auth = createNeonAuth({
    baseUrl: requireEnv("NEON_AUTH_BASE_URL"),
    cookies: { secret: cookieSecret, sessionDataTtl: 300 },
    logLevel: process.env.NODE_ENV === "production" ? "error" : "warn"
  });

  return auth;
}
