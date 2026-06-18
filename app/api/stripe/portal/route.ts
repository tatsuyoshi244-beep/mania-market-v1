import { NextResponse } from "next/server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/security/safe-log";
import { toUserFacingError } from "@/lib/security/safe-error";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login?next=/dashboard/billing" as Route);
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userData.user.id)
    .single();

  if (error || !user?.stripe_customer_id) {
    redirect("/dashboard/billing?error=請求情報がありません。先に有料プランへ登録してください。" as Route);
  }

  try {
    const session = await createBillingPortalSession(user.stripe_customer_id);
    return NextResponse.redirect(session.url!);
  } catch (err) {
    logServerError("stripePortalApi", err);
    redirect(`/dashboard/billing?error=${encodeURIComponent(toUserFacingError(err))}` as Route);
  }
}