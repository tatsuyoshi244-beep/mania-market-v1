import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Phase 1 では決済機能は未実装です。" },
    { status: 501 }
  );
}
