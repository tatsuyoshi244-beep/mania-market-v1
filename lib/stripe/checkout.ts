import type Stripe from "stripe";
import type { PlanKey } from "@/types/database";
import { getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getSiteUrl, getStripePriceId } from "@/lib/stripe/prices";

type CreateCheckoutInput = {
  userId: string;
  email: string;
  planKey: Exclude<PlanKey, "free">;
};

export async function createCheckoutSessionForPlan(input: CreateCheckoutInput) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(input.userId, input.email);
  const siteUrl = getSiteUrl();
  const priceId = getStripePriceId(input.planKey);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard/billing?success=1`,
    cancel_url: `${siteUrl}/dashboard/billing?canceled=1`,
    locale: "ja",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    metadata: {
      user_id: input.userId,
      plan_key: input.planKey
    },
    subscription_data: {
      metadata: {
        user_id: input.userId,
        plan_key: input.planKey
      }
    }
  });

  if (!session.url) {
    throw new Error("Checkout URLの生成に失敗しました。");
  }

  return session;
}

export function getSubscriptionIdFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (typeof session.subscription === "string") return session.subscription;
  return session.subscription?.id ?? null;
}