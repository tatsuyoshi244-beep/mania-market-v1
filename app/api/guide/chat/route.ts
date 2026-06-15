import { NextResponse } from "next/server";
import { extractGuideKeywords } from "@/lib/guide/keywords";
import { buildGuideResponse } from "@/lib/guide/respond";
import { searchGuideCatalog } from "@/lib/queries/guide";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or less` }, { status: 400 });
  }

  try {
    const supabase = createSupabasePublicClient();
    const keywords = extractGuideKeywords(message);
    const recommendations = await searchGuideCatalog(supabase, message, keywords);
    const response = buildGuideResponse(message, recommendations);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[api/guide/chat]", error);
    return NextResponse.json({ error: "Failed to process guide request" }, { status: 500 });
  }
}