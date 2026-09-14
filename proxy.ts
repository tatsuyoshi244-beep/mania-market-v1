import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "mania-market-v1.vercel.app";
const UNCONFIGURED_HOST = "mania-market-v1-7nnf.vercel.app";

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname !== UNCONFIGURED_HOST) {
    return NextResponse.next();
  }

  const destination = request.nextUrl.clone();
  destination.protocol = "https:";
  destination.hostname = CANONICAL_HOST;
  destination.port = "";

  return NextResponse.redirect(destination, 308);
}

export const config = {
  matcher: "/:path*"
};
