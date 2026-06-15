import type { Route } from "next";

export const SHOP_PAGE_SIZE = 12;
export const PRODUCT_PAGE_SIZE = 12;

export function parsePage(value?: string) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export function pageRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function buildPageHref(
  basePath: string,
  page: number,
  params: Record<string, string | undefined>
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return (query ? `${basePath}?${query}` : basePath) as Route;
}