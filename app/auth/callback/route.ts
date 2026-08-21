import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/mypage";
  return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}&notice=${encodeURIComponent("ログイン方式が更新されました。もう一度ログインしてください。")}`);
}
