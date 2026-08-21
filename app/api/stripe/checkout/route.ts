import { NextResponse } from "next/server";
import { createCheckoutSessionForPlan } from "@/lib/stripe/checkout";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { isPaidPlan } from "@/lib/stripe/prices";
import { getActiveSubscriptionForUser } from "@/lib/stripe/sync";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/neon/db";
import { logServerError } from "@/lib/security/safe-log";
import { toUserFacingError } from "@/lib/security/safe-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan;

  if (!plan || !isPaidPlan(plan)) {
    return NextResponse.json({ error: "無効なプランです。" }, { status: 400 });
  }

  const user = await getAuthUser();
  if (!user?.email) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  try {
    const activeSubscription = await getActiveSubscriptionForUser(null, user.id);

    if (activeSubscription?.stripe_subscription_id) {
      const billingUser = await queryOne<{stripe_customer_id:string|null}>("select stripe_customer_id from public.users where id=$1", [user.id]);

      if (!billingUser?.stripe_customer_id) {
        return NextResponse.json({ error: "請求情報が見つかりません。" }, { status: 400 });
      }

      const portal = await createBillingPortalSession(billingUser.stripe_customer_id);
      return NextResponse.json({ url: portal.url });
    }

    const session = await createCheckoutSessionForPlan({
      userId: user.id,
      email: user.email,
      planKey: plan
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logServerError("stripeCheckoutApi", error);
    return NextResponse.json({ error: toUserFacingError(error) }, { status: 500 });
  }
}
