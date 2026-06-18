import type { PlanKey } from "@/types/database";
import { requireEnv } from "@/lib/env";

const PAID_PLANS = new Set<PlanKey>(["standard", "premium"]);

export function isPaidPlan(plan: string): plan is Exclude<PlanKey, "free"> {
  return PAID_PLANS.has(plan as PlanKey);
}

export function getStripePriceId(plan: Exclude<PlanKey, "free">) {
  if (plan === "standard") return requireEnv("STRIPE_STANDARD_PRICE_ID");
  return requireEnv("STRIPE_PREMIUM_PRICE_ID");
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}