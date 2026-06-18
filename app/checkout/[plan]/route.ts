import { NextResponse } from "next/server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createCheckoutSessionForPlan } from "@/lib/stripe/checkout";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { isPaidPlan } from "@/lib/stripe/prices";
import { getActiveSubscriptionForUser } from "@/lib/stripe/sync";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/security/safe-log";
import { toUserFacingError } from "@/lib/security/safe-error";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ plan: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { plan } = await context.params;
  if (!isPaidPlan(plan)) {
    return NextResponse.json({ error: "無効なプランです。" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${plan}`)}` as Route);
  }

  try {
    const service = createSupabaseServiceClient();
    const activeSubscription = await getActiveSubscriptionForUser(service, userData.user.id);

    if (activeSubscription?.stripe_subscription_id) {
      const { data: user } = await supabase
        .from("users")
        .select("stripe_customer_id")
        .eq("id", userData.user.id)
        .single();

      if (!user?.stripe_customer_id) {
        throw new Error("請求情報が見つかりません。");
      }

      const portal = await createBillingPortalSession(user.stripe_customer_id);
      return NextResponse.redirect(portal.url!);
    }

    const session = await createCheckoutSessionForPlan({
      userId: userData.user.id,
      email: userData.user.email,
      planKey: plan
    });

    return NextResponse.redirect(session.url!);
  } catch (error) {
    logServerError("checkoutRoute", error);
    redirect(`/dashboard/billing?error=${encodeURIComponent(toUserFacingError(error))}` as Route);
  }
}