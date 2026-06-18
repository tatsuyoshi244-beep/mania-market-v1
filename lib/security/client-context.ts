import { createHash } from "crypto";
import { headers } from "next/headers";

function hashSalt() {
  return process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ?? "mania-market-dev-salt";
}

export function hashClientValue(value: string) {
  return createHash("sha256").update(`${hashSalt()}:${value}`).digest("hex");
}

export async function getRequestClientContext() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip") ?? "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";

  return {
    ipHash: hashClientValue(ip),
    userAgentHash: hashClientValue(userAgent)
  };
}