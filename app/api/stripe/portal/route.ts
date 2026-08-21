import { NextResponse } from "next/server";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/neon/db";
import { logServerError } from "@/lib/security/safe-log";
import { toUserFacingError } from "@/lib/security/safe-error";

export const runtime = "nodejs";

export async function POST() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login?next=/dashboard/billing" as Route);
  }

  const user = await queryOne<{stripe_customer_id:string|null}>("select stripe_customer_id from public.users where id=$1", [authUser.id]);

  if (!user?.stripe_customer_id) {
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
