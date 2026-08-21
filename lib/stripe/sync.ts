import type Stripe from "stripe";
import type { BillingEventType, PlanKey, SubscriptionStatus } from "@/types/database";
import { ACTIVE_SUBSCRIPTION_STATUSES, planFromPriceId } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { queryOne, queryRows } from "@/lib/neon/db";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (["active","trialing","past_due","canceled","unpaid","paused","incomplete_expired"].includes(status)) return status as SubscriptionStatus;
  return "incomplete";
}
function toIso(value:number|null|undefined) { return value ? new Date(value*1000).toISOString() : null; }
function customerId(value:string|Stripe.Customer|Stripe.DeletedCustomer|null) { return value ? (typeof value === "string" ? value : value.id) : null; }

export async function recordBillingEvent(_service: unknown, input:{userId?:string|null;subscriptionId?:string|null;eventType:BillingEventType;stripeEventId?:string|null;amount?:number|null;metadata?:Record<string,unknown>}) {
  const row = await queryOne<{id:string}>(
    `insert into public.billing_events (user_id,subscription_id,event_type,stripe_event_id,amount,metadata)
     values ($1,$2,$3,$4,$5,$6::jsonb) on conflict (stripe_event_id) where stripe_event_id is not null do nothing returning id::text`,
    [input.userId??null,input.subscriptionId??null,input.eventType,input.stripeEventId??null,input.amount??null,JSON.stringify(input.metadata??{})]
  );
  return Boolean(row);
}

async function resolveUserId(subscription:Stripe.Subscription, fallback?:string|null) {
  if (fallback) return fallback;
  if (subscription.metadata.user_id) return subscription.metadata.user_id;
  const customer = customerId(subscription.customer);
  if (!customer) return null;
  return (await queryOne<{id:string}>("select id from public.users where stripe_customer_id=$1 limit 1", [customer]))?.id ?? null;
}

export async function syncStripeSubscription(_service:unknown, subscription:Stripe.Subscription, options?:{userId?:string|null;stripeEventId?:string|null;billingEventType?:BillingEventType}) {
  const userId = await resolveUserId(subscription, options?.userId);
  if (!userId) throw new Error("サブスクリプションに紐づくユーザーが見つかりません。");
  const planKey = planFromPriceId(subscription.items.data[0]?.price.id ?? null);
  const status = mapStatus(subscription.status);
  const effectivePlan:PlanKey = ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? planKey : "free";
  const plan = await queryOne<{id:string}>("select id::text from public.plans where key=$1", [planKey]);
  if (!plan) throw new Error(`プランが見つかりません: ${planKey}`);
  const customer = customerId(subscription.customer);
  const saved = await queryOne<{id:string}>(
    `insert into public.subscriptions
     (user_id,plan_id,status,stripe_subscription_id,stripe_customer_id,current_period_start,current_period_end,canceled_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (stripe_subscription_id) do update set plan_id=excluded.plan_id,status=excluded.status,
     stripe_customer_id=excluded.stripe_customer_id,current_period_start=excluded.current_period_start,
     current_period_end=excluded.current_period_end,canceled_at=excluded.canceled_at,updated_at=now() returning id::text`,
    [userId,plan.id,status,subscription.id,customer,toIso(subscription.current_period_start),toIso(subscription.current_period_end),toIso(subscription.canceled_at)]
  );
  if (!saved) throw new Error("サブスクリプションを保存できませんでした。");
  await queryRows("update public.users set plan_key=$1,stripe_customer_id=$2,updated_at=now() where id=$3 returning id", [effectivePlan,customer,userId]);
  if (options?.billingEventType) await recordBillingEvent(null,{userId,subscriptionId:saved.id,eventType:options.billingEventType,stripeEventId:options.stripeEventId,metadata:{plan_key:effectivePlan,stripe_status:subscription.status,cancel_at_period_end:subscription.cancel_at_period_end}});
  return {userId,planKey:effectivePlan,subscriptionId:saved.id};
}

export async function downgradeUserToFree(_service:unknown,userId:string,options?:{stripeEventId?:string|null;billingEventType?:BillingEventType}) {
  await queryRows("update public.users set plan_key='free',updated_at=now() where id=$1 returning id",[userId]);
  if (options?.billingEventType) await recordBillingEvent(null,{userId,eventType:options.billingEventType,stripeEventId:options.stripeEventId,metadata:{plan_key:"free"}});
}

export async function syncSubscriptionById(service:unknown,subscriptionId:string,options?:{userId?:string|null;stripeEventId?:string|null;billingEventType?:BillingEventType}) {
  return syncStripeSubscription(service,await getStripe().subscriptions.retrieve(subscriptionId),options);
}

export async function getActiveSubscriptionForUser(_service:unknown,userId:string) {
  return queryOne<{id:string;status:string;stripe_subscription_id:string|null;current_period_end:string|null;plans:{key:string}|null}>(
    `select s.id::text,s.status::text,s.stripe_subscription_id,s.current_period_end::text,jsonb_build_object('key',p.key) plans
     from public.subscriptions s join public.plans p on p.id=s.plan_id where s.user_id=$1 and s.status in ('active','trialing','past_due')
     order by s.created_at desc limit 1`,[userId]);
}
