"use client";

import { useEffect } from "react";

type AnalyticsViewProps =
  | { type: "shop_view"; shopId: string; productId?: never }
  | { type: "product_view"; productId: string; shopId?: never };

export function AnalyticsView(props: AnalyticsViewProps) {
  const type = props.type;
  const targetId = type === "shop_view" ? props.shopId : props.productId;

  useEffect(() => {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(type === "shop_view" ? { type, shopId: targetId } : { type, productId: targetId }),
      keepalive: true
    }).catch(() => undefined);
  }, [targetId, type]);

  return null;
}
