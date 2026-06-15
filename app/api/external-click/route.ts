import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAnalyticsEvent } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "valid url is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  await recordAnalyticsEvent({
    type: "external_click",
    userId: data.user?.id,
    productId,
    metadata: { url }
  });

  return NextResponse.redirect(url, { status: 302 });
}
