import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSubscriptionIdFromCheckoutSession } from "@/lib/stripe/checkout";
import { recordBillingEvent, syncStripeSubscription, syncSubscriptionById } from "@/lib/stripe/sync";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/security/safe-log";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const service = createSupabaseServiceClient();
  const userId = session.metadata?.user_id ?? null;
  const subscriptionId = getSubscriptionIdFromCheckoutSession(session);

  if (subscriptionId) {
    await syncSubscriptionById(service, subscriptionId, {
      userId,
      stripeEventId: event.id,
      billingEventType: "checkout_completed"
    });
    return;
  }

  await recordBillingEvent(service, {
    userId,
    eventType: "checkout_completed",
    stripeEventId: event.id,
    amount: session.amount_total,
    metadata: { mode: session.mode, plan_key: session.metadata?.plan_key ?? null }
  });
}

async function handleSubscriptionEvent(
  event: Stripe.Event,
  billingEventType: "subscription_created" | "subscription_updated" | "subscription_canceled"
) {
  const subscription = event.data.object as Stripe.Subscription;
  const service = createSupabaseServiceClient();

  await syncStripeSubscription(service, subscription, {
    userId: subscription.metadata.user_id,
    stripeEventId: event.id,
    billingEventType
  });
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const service = createSupabaseServiceClient();
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  if (subscriptionId) {
    await syncSubscriptionById(service, subscriptionId, {
      stripeEventId: event.id,
      billingEventType: "payment_failed"
    });
    return;
  }

  await recordBillingEvent(service, {
    eventType: "payment_failed",
    stripeEventId: event.id,
    amount: invoice.amount_due,
    metadata: { invoice_id: invoice.id }
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    logServerError("stripeWebhook:signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "customer.subscription.created":
        await handleSubscriptionEvent(event, "subscription_created");
        break;
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event, "subscription_updated");
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event, "subscription_canceled");
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event);
        break;
      default:
        break;
    }
  } catch (error) {
    logServerError(`stripeWebhook:${event.type}`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}