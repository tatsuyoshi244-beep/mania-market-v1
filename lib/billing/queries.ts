import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PlanKey } from "@/types/database";
import { PLANS } from "@/lib/plans";
import { getProductLimitInfo } from "@/lib/products";

export type BillingSummary = {
  planKey: PlanKey;
  planName: string;
  monthlyPrice: number;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  limitInfo: Awaited<ReturnType<typeof getProductLimitInfo>>;
};

export async function getBillingSummary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BillingSummary> {
  const [{ data: user }, limitInfo, { data: subscription }] = await Promise.all([
    supabase.from("users").select("plan_key, stripe_customer_id").eq("id", userId).single(),
    getProductLimitInfo(supabase, userId),
    supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const planKey = (user?.plan_key ?? "free") as PlanKey;
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