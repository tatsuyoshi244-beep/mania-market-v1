import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingEventType, Database, PlanKey, SubscriptionStatus } from "@/types/database";
import { ACTIVE_SUBSCRIPTION_STATUSES, planFromPriceId } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { logServerError } from "@/lib/security/safe-log";

type ServiceClient = SupabaseClient<Database>;

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "unpaid") return "unpaid";
  if (status === "paused") return "paused";
  if (status === "incomplete_expired") return "incomplete_expired";
  return "incomplete";
}

function subscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function toIso(unixSeconds: number | null | undefined) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function getPlanId(service: ServiceClient, planKey: PlanKey) {
  const { data, error } = await service.from("plans").select("id").eq("key", planKey).single();
  if (error || !data) throw new Error(`プランが見つかりません: ${planKey}`);
  return data.id;
}

async function resolveUserId(
  service: ServiceClient,
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null
) {
  if (fallbackUserId) return fallbackUserId;
  if (subscription.metadata.user_id) return subscription.metadata.user_id;

  const stripeCustomerId = customerId(subscription.customer);
  if (!stripeCustomerId) return null;

  const { data: user } = await service
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  return user?.id ?? null;
}

export async function recordBillingEvent(
  service: ServiceClient,
  input: {
    userId?: string | null;
    subscriptionId?: string | null;
    eventType: BillingEventType;
    stripeEventId?: string | null;
    amount?: number | null;
    metadata?: Record<string, unknown>;
  }
) {
  if (input.stripeEventId) {
    const { data: existing } = await service
      .from("billing_events")
      .select("id")
      .eq("stripe_event_id", input.stripeEventId)
      .maybeSingle();
    if (existing) return false;
  }

  const { error } = await service.from("billing_events").insert({
    user_id: input.userId ?? null,
    subscription_id: input.subscriptionId ?? null,
    event_type: input.eventType,
    stripe_event_id: input.stripeEventId ?? null,
    amount: input.amount ?? null,
    metadata: (input.metadata ?? {}) as Database["public"]["Tables"]["billing_events"]["Insert"]["metadata"]
  });

  if (error) {
    logServerError("recordBillingEvent", error);
    throw error;
  }

  return true;
}

export async function syncStripeSubscription(
  service: ServiceClient,
  subscription: Stripe.Subscription,
  options?: { userId?: string | null; stripeEventId?: string | null; billingEventType?: BillingEventType }
) {
  const userId = await resolveUserId(service, subscription, options?.userId);
  if (!userId) {
    throw new Error("サブスクリプションに紐づくユーザーが見つかりません。");
  }

  const priceId = subscriptionPriceId(subscription);
  const planKey = planFromPriceId(priceId);
  const mappedStatus = mapStripeSubscriptionStatus(subscription.status);
  const isActive = ACTIVE_SUBSCRIPTION_STATUSES.has(mappedStatus);
  const effectivePlanKey: PlanKey = isActive ? planKey : "free";
  const planId = await getPlanId(service, planKey);
  const stripeCustomerId = customerId(subscription.customer);

  const subscriptionPayload = {
    user_id: userId,
    plan_id: planId,
    status: mappedStatus,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: stripeCustomerId,
    current_period_start: toIso(subscription.current_period_start),
    current_period_end: toIso(subscription.current_period_end),
    canceled_at: toIso(subscription.canceled_at)
  };

  const { data: savedSubscription, error: subscriptionError } = await service
    .from("subscriptions")
    .upsert(subscriptionPayload, { onConflict: "stripe_subscription_id" })
    .select("id")
    .single();

  if (subscriptionError) {
    throw subscriptionError;
  }

  const { error: userError } = await service
    .from("users")
    .update({
      plan_key: effectivePlanKey,
      stripe_customer_id: stripeCustomerId
    })
    .eq("id", userId);

  if (userError) {
    throw userError;
  }

  if (options?.billingEventType) {
    await recordBillingEvent(service, {
      userId,
      subscriptionId: savedSubscription.id,
      eventType: options.billingEventType,
      stripeEventId: options.stripeEventId ?? null,
      metadata: {
        plan_key: effectivePlanKey,
        stripe_status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    });
  }

  return { userId, planKey: effectivePlanKey, subscriptionId: savedSubscription.id };
}

export async function downgradeUserToFree(
  service: ServiceClient,
  userId: string,
  options?: { stripeEventId?: string | null; billingEventType?: BillingEventType }
) {
  const { error: userError } = await service
    .from("users")
    .update({ plan_key: "free" })
    .eq("id", userId);

  if (userError) throw userError;

  if (options?.billingEventType) {
    await recordBillingEvent(service, {
      userId,
      eventType: options.billingEventType,
      stripeEventId: options.stripeEventId ?? null,
      metadata: { plan_key: "free" }
    });
  }
}

export async function syncSubscriptionById(
  service: ServiceClient,
  subscriptionId: string,
  options?: { userId?: string | null; stripeEventId?: string | null; billingEventType?: BillingEventType }
) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return syncStripeSubscription(service, subscription, options);
}

export async function getActiveSubscriptionForUser(service: ServiceClient, userId: string) {
  const { data } = await service
    .from("subscriptions")
    .select("id, status, stripe_subscription_id, current_period_end, plans(key)")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}