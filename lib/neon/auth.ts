import "server-only";

import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { requireEnv } from "@/lib/env";

let auth: NeonAuth | null = null;

export function getNeonAuth() {
  if (auth) return auth;

  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET || requireEnv("DATABASE_URL");
  // Neon Project Info exposes the complete Auth URL. The server SDK appends
  // endpoints such as sign-up/email, so the /auth path must be preserved.
  const baseUrl = requireEnv("NEON_AUTH_BASE_URL").trim().replace(/\/$/, "");
  auth = createNeonAuth({
    baseUrl,
    cookies: { secret: cookieSecret, sessionDataTtl: 300 },
    logLevel: process.env.NODE_ENV === "production" ? "error" : "warn"
  });

  return auth;
}
