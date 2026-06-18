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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan;

  if (!plan || !isPaidPlan(plan)) {
    return NextResponse.json({ error: "無効なプランです。" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
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
        return NextResponse.json({ error: "請求情報が見つかりません。" }, { status: 400 });
      }

      const portal = await createBillingPortalSession(user.stripe_customer_id);
      return NextResponse.json({ url: portal.url });
    }

    const session = await createCheckoutSessionForPlan({
      userId: userData.user.id,
      email: userData.user.email,
      planKey: plan
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logServerError("stripeCheckoutApi", error);
    return NextResponse.json({ error: toUserFacingError(error) }, { status: 500 });
  }
}