export type GuideCategoryRec = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type GuideShopRec = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url?: string | null;
};

export type GuideProductRec = {
  id: string;
  name: string;
  description: string | null;
  price_label: string | null;
  image_url: string | null;
  shop_name?: string | null;
  shop_slug?: string | null;
};

export type GuideRecommendations = {
  categories: GuideCategoryRec[];
  shops: GuideShopRec[];
  products: GuideProductRec[];
};

export type GuideChatResponse = {
  message: string;
  disclaimer: string;
  recommendations: GuideRecommendations;
};

export type GuideChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: GuideRecommendations;
  disclaimer?: string;
};