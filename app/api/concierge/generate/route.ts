import { NextResponse } from "next/server";
import { loadConciergeContext } from "@/lib/concierge/context";
import { getConciergeProvider } from "@/lib/concierge/provider";
import type { GenerateType } from "@/types/concierge";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_TYPES: GenerateType[] = [
  "shop_description",
  "product_description",
  "sns_post",
  "catch_copy"
];

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
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

  const context = await loadConciergeContext(null, user.id);
  const provider = getConciergeProvider();
  const result = await provider.generateText({
    type: body.type,
    context,
    hints: body.hints
  });

  return NextResponse.json(result);
}
