import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ProbeBody = {
  code?: string;
  error?: { code?: string };
};

function authEndpoint() {
  const base = process.env.NEON_AUTH_BASE_URL ?? process.env.VITE_NEON_AUTH_URL;
  if (!base) return null;
  return new URL("sign-in/email", `${base.replace(/\/$/, "")}/`);
}

export async function GET() {
  const endpoint = authEndpoint();
  if (!endpoint) {
    return NextResponse.json({ status: "unconfigured", check: "auth_mutation" }, { status: 503 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mania-market-v1.vercel.app";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin,
        "x-neon-auth-proxy": "nextjs"
      },
      body: JSON.stringify({
        email: "auth-healthcheck@example.invalid",
        password: "Healthcheck-only-not-a-user-9x!"
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    });
    const body = await response.json().catch(() => ({})) as ProbeBody;
    const code = body.code ?? body.error?.code ?? "UNKNOWN";

    if (code === "INVALID_ORIGIN" || code === "MISSING_OR_NULL_ORIGIN") {
      return NextResponse.json(
        { status: "origin_rejected", check: "auth_mutation", origin },
        { status: 503, headers: { "cache-control": "no-store" } }
      );
    }
    if (response.status >= 500) {
      return NextResponse.json(
        { status: "unavailable", check: "auth_mutation" },
        { status: 503, headers: { "cache-control": "no-store" } }
      );
    }
    if (![200, 400, 401, 403, 422, 429].includes(response.status)) {
      return NextResponse.json(
        { status: "misconfigured", check: "auth_mutation" },
        { status: 503, headers: { "cache-control": "no-store" } }
      );
    }

    // Invalid credentials or validation errors prove that the mutation endpoint
    // accepted the production Origin without creating a user.
    return NextResponse.json(
      { status: "ok", check: "auth_mutation", result: "origin_accepted" },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    console.error("[health/auth] mutation probe failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });
    return NextResponse.json(
      { status: "unreachable", check: "auth_mutation" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
