import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/neon/db";
import { getRequestClientContext } from "@/lib/security/client-context";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { logServerError } from "@/lib/security/safe-log";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await queryOne<{ external_url: string }>(
    `select p.external_url from public.products p
     join public.shops s on s.id = p.shop_id
     where p.id = $1::uuid and p.status = 'active' and s.is_published = true limit 1`,
    [productId]
  );
  if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });

  let destination: URL;
  try {
    destination = new URL(product.external_url);
    if ((destination.protocol !== "https:" && destination.protocol !== "http:") || destination.username || destination.password) {
      throw new Error();
    }
  } catch {
    return NextResponse.json({ error: "product URL is invalid" }, { status: 422 });
  }

  try {
    const [user, ctx] = await Promise.all([getAuthUser(), getRequestClientContext()]);
    await enforceRateLimit("analytics_views", ctx.ipHash);
    await recordAnalyticsEvent({
      type: "external_click",
      userId: user?.id,
      productId,
      metadata: { url: product.external_url }
    });
  } catch (error) {
    // A temporary analytics failure must not prevent a customer from reaching the seller.
    logServerError("external-click.analytics", error);
  }

  return NextResponse.redirect(destination, { status: 302 });
}
