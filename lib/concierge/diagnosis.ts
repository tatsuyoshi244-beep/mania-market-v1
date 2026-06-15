import type { Route } from "next";
import type { ConciergeContext, DiagnosisItem, ShopDiagnosis } from "@/types/concierge";

function hasMinText(value: string | null | undefined, min: number) {
  return (value?.trim().length ?? 0) >= min;
}

export function diagnoseShop(context: ConciergeContext): ShopDiagnosis {
  const shop = context.shop;
  const items: DiagnosisItem[] = [
    {
      key: "name",
      label: "ショップ名",
      done: hasMinText(shop?.name, 2),
      weight: 5,
      href: "/dashboard" as Route
    },
    {
      key: "slug",
      label: "slug（URL）",
      done: hasMinText(shop?.slug, 3),
      weight: 5,
      href: "/dashboard" as Route
    },
    {
      key: "description",
      label: "ショップ説明（50文字以上）",
      done: hasMinText(shop?.description, 50),
      weight: 15,
      href: "/dashboard" as Route
    },
    {
      key: "categories",
      label: "カテゴリ登録",
      done: context.shopCategoryNames.length > 0,
      weight: 10,
      href: "/dashboard" as Route
    },
    {
      key: "logo",
      label: "ロゴ画像",
      done: hasMinText(shop?.logo_url, 10),
      weight: 10,
      href: "/dashboard" as Route
    },
    {
      key: "cover",
      label: "カバー画像",
      done: hasMinText(shop?.cover_image_url, 10),
      weight: 10,
      href: "/dashboard" as Route
    },
    {
      key: "website",
      label: "公式サイトURL",
      done: hasMinText(shop?.website_url, 10),
      weight: 10,
      href: "/dashboard" as Route
    },
    {
      key: "sns",
      label: "SNSリンク（X or Instagram）",
      done: hasMinText(shop?.twitter_url, 10) || hasMinText(shop?.instagram_url, 10),
      weight: 10,
      href: "/dashboard" as Route
    },
    {
      key: "published",
      label: "ショップ公開",
      done: shop?.is_published === true,
      weight: 10,
      href: "/dashboard" as Route
    },
    {
      key: "products",
      label: "公開商品 1点以上",
      done: context.activeProductCount >= 1,
      weight: 15,
      href: "/dashboard/products" as Route
    }
  ];

  const score = Math.round(items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0));

  return { score, items };
}