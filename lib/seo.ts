export const SITE_NAME = "Mania Market（マニアマーケット）";
export const SITE_DESCRIPTION =
  "ヴィンテージ、クラフト、アウトドア、音楽、コレクション、食、Web・アプリ、AI・生成AIの専門店と商品を探せる発見プラットフォーム。";

const fallbackSiteUrl = "https://mania-market-v1.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return fallbackSiteUrl;

  try {
    const url = new URL(configured);
    return url.origin;
  } catch {
    return fallbackSiteUrl;
  }
}

export function absoluteUrl(path: string) {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function compactDescription(value: string | null | undefined, fallback: string, maxLength = 150) {
  const text = value?.replace(/\s+/g, " ").trim() || fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function normalizeSearchQuery(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim().slice(0, 80) || undefined;
}
