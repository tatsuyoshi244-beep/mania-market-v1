import type { PlanKey } from "@/types/database";
import { PLANS } from "@/lib/plans";
import { getProductLimitInfo } from "@/lib/products";
import { queryOne } from "@/lib/neon/db";

export type BillingSummary = {
  planKey: PlanKey;
  planName: string;
  monthlyPrice: number;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  limitInfo: Awaited<ReturnType<typeof getProductLimitInfo>>;
};

export async function getBillingSummary(userId: string): Promise<BillingSummary> {
  const [user, limitInfo, subscription] = await Promise.all([
    queryOne<{ plan_key: PlanKey; stripe_customer_id: string | null }>(
      `select plan_key, stripe_customer_id from public.users where id=$1`, [userId]
    ),
    getProductLimitInfo(userId),
    queryOne<{ status: string; current_period_end: string | null }>(
      `select status::text, current_period_end::text from public.subscriptions
       where user_id=$1 and status in ('active','trialing','past_due')
       order by created_at desc limit 1`, [userId]
    )
  ]);

  const planKey = user?.plan_key ?? "free";
  const plan = PLANS[planKey];

  return {
    planKey,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice,
    stripeCustomerId: user?.stripe_customer_id ?? null,
    subscriptionStatus: subscription?.status ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    limitInfo
  };
}
