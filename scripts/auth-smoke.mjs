const base = (process.env.AUTH_CHECK_URL ?? "https://mania-market-v1.vercel.app").replace(/\/$/, "");
const response = await fetch(`${base}/api/health/auth`, {
  headers: { "user-agent": "mania-market-auth-smoke/1.0" }
});
const body = await response.json().catch(() => ({}));

if (!response.ok || body.status !== "ok") {
  console.error("Auth readiness check failed", { status: response.status, body });
  process.exit(1);
}

console.log("Auth readiness check passed", body);
