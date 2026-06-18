import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { RATE_LIMIT_USER_ERROR } from "@/lib/security/safe-error";

export type RateLimitProfile =
  | "application_submit"
  | "product_ops"
  | "social_ops"
  | "admin_ops";

const RATE_LIMITS: Record<RateLimitProfile, { max: number; windowSeconds: number }> = {
  application_submit: { max: 3, windowSeconds: 3600 },
  product_ops: { max: 30, windowSeconds: 3600 },
  social_ops: { max: 100, windowSeconds: 3600 },
  admin_ops: { max: 60, windowSeconds: 3600 }
};

export function buildRateLimitKey(profile: RateLimitProfile, subject: string) {
  return `${profile}:${subject}`;
}

export async function enforceRateLimit(
  service: SupabaseClient<Database>,
  profile: RateLimitProfile,
  subject: string
) {
  const config = RATE_LIMITS[profile];
  const bucketKey = buildRateLimitKey(profile, subject);

  const { data, error } = await service.rpc("consume_rate_limit", {
    p_bucket_key: bucketKey,
    p_max_count: config.max,
    p_window_seconds: config.windowSeconds
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(RATE_LIMIT_USER_ERROR);
  }
}