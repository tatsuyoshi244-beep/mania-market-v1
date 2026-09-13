import type { Route } from "next";

export function safeInternalRoute(value: string | null | undefined, fallback: Route): Route {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value as Route;
}
