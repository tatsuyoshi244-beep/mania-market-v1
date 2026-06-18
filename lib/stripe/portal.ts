import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/stripe/prices";

export async function createBillingPortalSession(customerId: string) {
  const stripe = getStripe();
  const siteUrl = getSiteUrl();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/dashboard/billing`
  });

  if (!session.url) {
    throw new Error("Customer Portal URLの生成に失敗しました。");
  }

  return session;
}