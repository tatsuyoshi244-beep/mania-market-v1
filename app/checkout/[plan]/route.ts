import { NextResponse } from "next/server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createCheckoutSessionForPlan } from "@/lib/stripe/checkout";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { isPaidPlan } from "@/lib/stripe/prices";
import { getActiveSubscriptionForUser } from "@/lib/stripe/sync";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/neon/db";
import { logServerError } from "@/lib/security/safe-log";
import { toUserFacingError } from "@/lib/security/safe-error";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ plan: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { plan } = await context.params;
  if (!isPaidPlan(plan)) {
    return NextResponse.json({ error: "無効なプランです。" }, { status: 400 });
  }

  const user = await getAuthUser();
  if (!user?.email) {
    redirect(`/login?next=${encodeURIComponent(`/checkout/${plan}`)}` as Route);
  }

  try {
    const activeSubscription = await getActiveSubscriptionForUser(null, user.id);

    if (activeSubscription?.stripe_subscription_id) {
      const billingUser = await queryOne<{stripe_customer_id:string|null}>("select stripe_customer_id from public.users where id=$1", [user.id]);

      if (!billingUser?.stripe_customer_id) {
        throw new Error("請求情報が見つかりません。");
      }

      const portal = await createBillingPortalSession(billingUser.stripe_customer_id);
      return NextResponse.redirect(portal.url!);
    }

    const session = await createCheckoutSessionForPlan({
      userId: user.id,
      email: user.email,
      planKey: plan
    });

    return NextResponse.redirect(session.url!);
  } catch (error) {
    logServerError("checkoutRoute", error);
    redirect(`/dashboard/billing?error=${encodeURIComponent(toUserFacingError(error))}` as Route);
  }
}
