import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  service?: SupabaseClient<Database>
) {
  const db = service ?? createSupabaseServiceClient();
  const { data: user, error } = await db
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("ユーザーが見つかりません。");
  }

  const stripe = getStripe();

  if (user.stripe_customer_id) {
    const existing = await stripe.customers.retrieve(user.stripe_customer_id);
    if (!existing.deleted) {
      return user.stripe_customer_id;
    }
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId }
  });

  const { error: updateError } = await db
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  return customer.id;
}