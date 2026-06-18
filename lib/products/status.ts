import type { ProductStatus } from "@/types/database";

export type ProductUiStatus = "draft" | "published";

export function toDbProductStatus(uiStatus: ProductUiStatus): ProductStatus {
  return uiStatus === "published" ? "active" : "hidden";
}

export function toUiProductStatus(dbStatus: ProductStatus): ProductUiStatus {
  return dbStatus === "active" ? "published" : "draft";
}

export function productStatusLabel(dbStatus: ProductStatus) {
  return toUiProductStatus(dbStatus) === "published" ? "公開" : "下書き";
}

export const COUNTABLE_PRODUCT_STATUSES: ProductStatus[] = ["active", "hidden"];