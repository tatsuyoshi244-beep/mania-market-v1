import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "valid url is required" }, { status: 400 });
  }

  const user = await getAuthUser();

  await recordAnalyticsEvent({
    type: "external_click",
    userId: user?.id,
    productId,
    metadata: { url }
  });

  return NextResponse.redirect(url, { status: 302 });
}
