import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Phase 1 では決済機能は未実装です。" },
    { status: 501 }
  );
}
