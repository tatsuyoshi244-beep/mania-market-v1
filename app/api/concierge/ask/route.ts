import { NextResponse } from "next/server";
import { loadConciergeContext } from "@/lib/concierge/context";
import { getConciergeProvider } from "@/lib/concierge/provider";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 500;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { question?: string };
  try {
    body = (await request.json()) as { question?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = body.question?.trim() ?? "";
  if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });
  if (question.length > MAX_LENGTH) {
    return NextResponse.json({ error: `question must be ${MAX_LENGTH} chars or less` }, { status: 400 });
  }

  const context = await loadConciergeContext(supabase, userData.user.id);
  const provider = getConciergeProvider();
  const result = await provider.answerQuestion(question, context);

  return NextResponse.json(result);
}