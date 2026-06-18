import type { PostgrestError } from "@supabase/supabase-js";
import { isDevelopment } from "@/lib/env";
import { logServerError } from "@/lib/security/safe-log";

export type QueryResult<T> = {
  data: T;
  error: PostgrestError | Error | null;
  source: string;
};

export function formatSupabaseError(error: unknown): string {
  if (isDevelopment()) {
    return JSON.stringify(error, null, 2);
  }
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const record = error as { code?: string; message?: string };
    return `${record.code ?? "error"}: ${record.message ?? "unknown"}`;
  }
  return "supabase error";
}

export function logSupabaseError(source: string, error: unknown) {
  logServerError(`Supabase:${source}`, error);
}

export function queryFailure<T>(source: string, error: unknown, fallback: T): QueryResult<T> {
  logSupabaseError(source, error);
  return {
    data: fallback,
    error: error instanceof Error ? error : (error as PostgrestError),
    source
  };
}

export function querySuccess<T>(source: string, data: T): QueryResult<T> {
  return { data, error: null, source };
}