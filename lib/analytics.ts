import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { AnalyticsEventType, Json } from "@/types/database";

export type { AnalyticsEventType };

export async function recordAnalyticsEvent(input: {
  type: AnalyticsEventType;
  userId?: string | null;
  shopId?: string | null;
  productId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createSupabaseServiceClient();
  await supabase.from("analytics_events").insert({
    event_type: input.type,
    user_id: input.userId ?? null,
    shop_id: input.shopId ?? null,
    product_id: input.productId ?? null,
    metadata: (input.metadata ?? {}) as Json
  });
}
