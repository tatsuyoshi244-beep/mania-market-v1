import "server-only";

import { neon } from "@neondatabase/serverless";
import { requireEnv } from "@/lib/env";

type SqlValue = string | number | boolean | Date | null | Array<string | number>;

let client: ReturnType<typeof neon> | null = null;

function getClient() {
  if (!client) client = neon(requireEnv("DATABASE_URL"));
  return client;
}

export async function queryRows<T>(text: string, params: SqlValue[] = []): Promise<T[]> {
  const result = await getClient().query(text, params);
  return result as T[];
}

export async function queryOne<T>(text: string, params: SqlValue[] = []): Promise<T | null> {
  const rows = await queryRows<T>(text, params);
  return rows[0] ?? null;
}
