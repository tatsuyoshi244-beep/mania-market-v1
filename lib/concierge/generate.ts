import type { ConciergeContext, GenerateType } from "@/types/concierge";

export type GenerateInput = {
  type: GenerateType;
  context: ConciergeContext;
  hints?: {
    productId?: string;
    productName?: string;
    keywords?: string;
    tone?: string;
  };
};

export function generateConciergeText(input: GenerateInput) {
  const { type, context, hints } = input;
  const shopName = context.shop?.name ?? "あなたのショップ";
  const categories = context.shopCategoryNames.join("・") || "マニア向け専門";
  const keywords = hints?.keywords?.trim() || categories;

  switch (type) {
    case "shop_description":
      return {
        draft: `${shopName}は、${categories}に特化した専門店です。${keywords}への深いこだわりを大切に、マニアの目線で厳選した一品を揃えています。知る人だけが辿り着く、熱量の高いセレクトショップとして、あなたの「好き」を応援します。購入は公式サイトよりお願いいたします。`,
        model: "rule-v1"
      };

    case "product_description": {
      const product =
        context.products.find((p) => p.id === hints?.productId) ??
        (hints?.productName
          ? context.products.find((p) => p.name.includes(hints.productName!))
          : context.products[0]);
      const productName = product?.name ?? hints?.productName ?? "こだわりの一品";
      const price = product?.price_label ? `（${product.price_label}）` : "";
      return {
        draft: `【${productName}】${price}\n${keywords}好きにはたまらない、マニア目線で選んだアイテムです。状態・希少性・世界観を大切に、${shopName}がお届けします。詳細・ご購入は各ショップの公式ページからお願いいたします。`,
        model: "rule-v1"
      };
    }

    case "sns_post":
      return {
        draft: `📍 ${shopName}\n\n${categories}が好きな方へ。\n${keywords}の世界観を、Mania Market でも発見できます。\n\n▶ プロフィールのリンクからチェック\n#mania #${keywords.replace(/\s+/g, "")} #マニア`,
        model: "rule-v1"
      };

    case "catch_copy":
      return {
        draft: [
          `${keywords}、ここから。`,
          `マニアのための${categories}、${shopName}`,
          `知る人だけが辿り着く、${shopName}`
        ].join("\n"),
        model: "rule-v1"
      };

    default:
      return { draft: "", model: "rule-v1" };
  }
}