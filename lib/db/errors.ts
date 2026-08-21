import { isDevelopment } from "@/lib/env";
import { logServerError } from "@/lib/security/safe-log";

export type QueryResult<T> = { data: T; error: Error | null; source: string };

export function formatDatabaseError(error: unknown): string {
  if (isDevelopment()) return JSON.stringify(error, null, 2);
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const record = error as { code?: string; message?: string };
    return `${record.code ?? "error"}: ${record.message ?? "unknown"}`;
  }
  return "database error";
}

export function queryFailure<T>(source: string, error: unknown, fallback: T): QueryResult<T> {
  logServerError(`Database:${source}`, error);
  return { data: fallback, error: error instanceof Error ? error : new Error("database query failed"), source };
}

export function querySuccess<T>(source: string, data: T): QueryResult<T> {
  return { data, error: null, source };
}
