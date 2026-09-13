import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type AnalyticsEventType } from "@/lib/analytics";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/neon/db";
import { getRequestClientContext } from "@/lib/security/client-context";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { RATE_LIMIT_USER_ERROR } from "@/lib/security/safe-error";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    type?: AnalyticsEventType;
    shopId?: string;
    productId?: string;
  } | null;

  if (!body || (body.type !== "shop_view" && body.type !== "product_view")) {
    return NextResponse.json({ error: "unsupported event type" }, { status: 400 });
  }

  const ctx = await getRequestClientContext();
  try {
    await enforceRateLimit("analytics_views", ctx.ipHash);
  } catch (error) {
    if (error instanceof Error && error.message === RATE_LIMIT_USER_ERROR) {
      return NextResponse.json({ error: RATE_LIMIT_USER_ERROR }, { status: 429 });
    }
    throw error;
  }

  let shopId: string | null = null;
  let productId: string | null = null;

  if (body.type === "shop_view") {
    if (!body.shopId || !UUID_PATTERN.test(body.shopId)) {
      return NextResponse.json({ error: "valid shopId is required" }, { status: 400 });
    }
    const shop = await queryOne<{ id: string }>(
      "select id::text from public.shops where id=$1::uuid and is_published=true limit 1",
      [body.shopId]
    );
    if (!shop) return NextResponse.json({ error: "shop not found" }, { status: 404 });
    shopId = shop.id;
  } else {
    if (!body.productId || !UUID_PATTERN.test(body.productId)) {
      return NextResponse.json({ error: "valid productId is required" }, { status: 400 });
    }
    const product = await queryOne<{ id: string; shop_id: string }>(
      `select p.id::text, p.shop_id::text from public.products p
       join public.shops s on s.id=p.shop_id
       where p.id=$1::uuid and p.status='active' and s.is_published=true limit 1`,
      [body.productId]
    );
    if (!product) return NextResponse.json({ error: "product not found" }, { status: 404 });
    productId = product.id;
    shopId = product.shop_id;
  }

  const user = await getAuthUser();

  await recordAnalyticsEvent({
    type: body.type,
    userId: user?.id,
    shopId,
    productId
  });

  return NextResponse.json({ ok: true });
}
