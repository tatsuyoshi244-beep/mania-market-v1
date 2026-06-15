import type { Route } from "next";

export type ConciergeShop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  is_published: boolean;
};

export type ConciergeProduct = {
  id: string;
  name: string;
  description: string | null;
  price_label: string | null;
  image_url: string | null;
  status: string;
  tags: string[];
};

export type ConciergeContext = {
  shop: ConciergeShop | null;
  shopCategoryNames: string[];
  shopCategorySlugs: string[];
  products: ConciergeProduct[];
  activeProductCount: number;
};

export type DiagnosisItem = {
  key: string;
  label: string;
  done: boolean;
  weight: number;
  href?: Route;
};

export type ShopDiagnosis = {
  score: number;
  items: DiagnosisItem[];
};

export type ConciergeTask = {
  id: string;
  label: string;
  priority: "high" | "medium" | "low";
  href?: Route;
};

export type ConciergeActions = {
  today: ConciergeTask[];
  missing: string[];
  nextAction: { label: string; description: string; href: Route } | null;
};

export type PopularTag = { tag: string; count: number };

export type RelatedCategory = { name: string; slug: string; reason: string };

export type SeasonalTrend = { title: string; description: string; tags: string[] };

export type MarketingSuggestions = {
  popularTags: PopularTag[];
  relatedCategories: RelatedCategory[];
  seasonalTrends: SeasonalTrend[];
};

export type GenerateType =
  | "shop_description"
  | "product_description"
  | "sns_post"
  | "catch_copy";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export type ConciergePayload = {
  context: ConciergeContext;
  diagnosis: ShopDiagnosis;
  actions: ConciergeActions;
  marketing: MarketingSuggestions;
};