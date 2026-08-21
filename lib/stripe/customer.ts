import { getStripe } from "@/lib/stripe";
import { queryOne, queryRows } from "@/lib/neon/db";

export async function getOrCreateStripeCustomer(userId: string, email: string, _service?: unknown) {
  const user = await queryOne<{stripe_customer_id:string|null}>("select stripe_customer_id from public.users where id=$1", [userId]);
  if (!user) throw new Error("ユーザーが見つかりません。");
  const stripe = getStripe();
  if (user.stripe_customer_id) {
    const existing = await stripe.customers.retrieve(user.stripe_customer_id);
    if (!existing.deleted) return user.stripe_customer_id;
  }
  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });
  await queryRows("update public.users set stripe_customer_id=$1,updated_at=now() where id=$2 returning id", [customer.id,userId]);
  return customer.id;
}
