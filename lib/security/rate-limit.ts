import { queryOne, queryRows } from "@/lib/neon/db";
import { RATE_LIMIT_USER_ERROR } from "@/lib/security/safe-error";

export type RateLimitProfile =
  | "application_submit"
  | "product_ops"
  | "social_ops"
  | "admin_ops"
  | "analytics_views";

const RATE_LIMITS: Record<RateLimitProfile, { max: number; windowSeconds: number }> = {
  application_submit: { max: 3, windowSeconds: 3600 },
  product_ops: { max: 30, windowSeconds: 3600 },
  social_ops: { max: 100, windowSeconds: 3600 },
  admin_ops: { max: 60, windowSeconds: 3600 },
  analytics_views: { max: 300, windowSeconds: 3600 }
};

export function buildRateLimitKey(profile: RateLimitProfile, subject: string) {
  return `${profile}:${subject}`;
}

export async function enforceRateLimit(profile: RateLimitProfile, subject: string) {
  const config = RATE_LIMITS[profile];
  const bucketKey = buildRateLimitKey(profile, subject);

  const result = await queryOne<{ count: number }>(
    `select count(*)::int as count from public.rate_limit_events
     where bucket = $1 and subject_hash = $2
       and created_at >= now() - ($3::text || ' seconds')::interval`,
    [profile, bucketKey, config.windowSeconds]
  );
  if ((result?.count ?? 0) >= config.max) {
    throw new Error(RATE_LIMIT_USER_ERROR);
  }
  await queryRows(
    `insert into public.rate_limit_events (bucket, subject_hash)
     values ($1, $2) returning id`,
    [profile, bucketKey]
  );
}
