import { NextResponse } from "next/server";
import { queryOne } from "@/lib/neon/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const authConfigured = Boolean(process.env.NEON_AUTH_BASE_URL ?? process.env.VITE_NEON_AUTH_URL);
  let database: "ok" | "unconfigured" | "unreachable" = databaseConfigured ? "unreachable" : "unconfigured";

  if (databaseConfigured) {
    try {
      const result = await queryOne<{ ok: number }>("select 1::int as ok");
      database = result?.ok === 1 ? "ok" : "unreachable";
    } catch (error) {
      console.error("[health] database check failed", {
        message: error instanceof Error ? error.message : "unknown error"
      });
    }
  }

  const healthy = database === "ok" && authConfigured;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        database,
        auth: authConfigured ? "configured" : "unconfigured",
        stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "optional"
      },
      deployment: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"
    },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" }
    }
  );
}
