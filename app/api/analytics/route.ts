import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type AnalyticsEventType } from "@/lib/analytics";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    type?: AnalyticsEventType;
    userId?: string;
    shopId?: string;
    productId?: string;
    metadata?: Record<string, unknown>;
  };

  if (!body.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  await recordAnalyticsEvent({
    type: body.type,
    userId: body.userId,
    shopId: body.shopId,
    productId: body.productId,
    metadata: body.metadata
  });

  return NextResponse.json({ ok: true });
}
