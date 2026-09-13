"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AcquisitionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get("utm_source");
    const medium = searchParams.get("utm_medium");
    const campaign = searchParams.get("utm_campaign");
    const referral = searchParams.get("ref");
    const referrerHost = safeHost(document.referrer);
    if (!source && !medium && !campaign && !referral && !referrerHost) return;

    const signature = [pathname, source, medium, campaign, referral, referrerHost].join("|");
    const storageKey = `mania-attribution:${signature}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        type: "landing_view",
        metadata: { path: pathname, source, medium, campaign, referral, referrer_host: referrerHost }
      })
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}

function safeHost(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.host === window.location.host ? null : url.host;
  } catch {
    return null;
  }
}
