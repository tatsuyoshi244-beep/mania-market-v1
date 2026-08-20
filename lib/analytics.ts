import { queryRows } from "@/lib/neon/db";
import type { AnalyticsEventType } from "@/types/database";

export type { AnalyticsEventType };

export async function recordAnalyticsEvent(input: {
  type: AnalyticsEventType;
  userId?: string | null;
  shopId?: string | null;
  productId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await queryRows(
    `insert into public.analytics_events (event_type, user_id, shop_id, product_id, metadata)
     values ($1, $2, $3, $4, $5::jsonb) returning id`,
    [input.type, input.userId ?? null, input.shopId ?? null, input.productId ?? null,
      JSON.stringify(input.metadata ?? {})]
  );
}
