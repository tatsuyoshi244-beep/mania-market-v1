import type { PlanKey } from "@/types/database";

export type Plan = {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  productLimit: number | null;
  stripePriceEnv?: string;
};

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: "free",
    name: "無料",
    monthlyPrice: 0,
    productLimit: 3
  },
  standard: {
    key: "standard",
    name: "スタンダード",
    monthlyPrice: 980,
    productLimit: 30,
    stripePriceEnv: "STRIPE_STANDARD_PRICE_ID"
  },
  premium: {
    key: "premium",
    name: "プレミアム",
    monthlyPrice: 2980,
    productLimit: null,
    stripePriceEnv: "STRIPE_PREMIUM_PRICE_ID"
  }
};

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due"
]);

export function getPlanLimit(plan: PlanKey) {
  return PLANS[plan].productLimit;
}

export function planFromPriceId(priceId: string | null | undefined): PlanKey {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_STANDARD_PRICE_ID) return "standard";
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "premium";
  return "free";
}