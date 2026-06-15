import { NextResponse } from "next/server";
import { loadConciergeContext } from "@/lib/concierge/context";
import { getConciergeProvider } from "@/lib/concierge/provider";
import type { GenerateType } from "@/types/concierge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_TYPES: GenerateType[] = [
  "shop_description",
  "product_description",
  "sns_post",
  "catch_copy"
];

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: GenerateType; hints?: Record<string, string> };
  try {
    body = (await request.json()) as { type?: GenerateType; hints?: Record<string, string> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const context = await loadConciergeContext(supabase, userData.user.id);
  const provider = getConciergeProvider();
  const result = await provider.generateText({
    type: body.type,
    context,
    hints: body.hints
  });

  return NextResponse.json(result);
}