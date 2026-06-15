import type { PostgrestError } from "@supabase/supabase-js";

export type QueryResult<T> = {
  data: T;
  error: PostgrestError | Error | null;
  source: string;
};

export function formatSupabaseError(error: unknown): string {
  return JSON.stringify(error, null, 2);
}

export function logSupabaseError(source: string, error: unknown) {
  console.error(`[Supabase:${source}]`, formatSupabaseError(error));
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