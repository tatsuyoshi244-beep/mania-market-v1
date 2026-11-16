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
  const categories = context.shopCategoryNames.join("・") || "こだわりの専門分野";
  const keywords = hints?.keywords?.trim() || categories;

  switch (type) {
    case "shop_description":
      return {
        draft: `${shopName}は、${categories}に特化した専門店です。${keywords}への深い知識とこだわりを大切に、理由を持って選んだ一品を揃えています。商品との出会いを通じて、あなたの「好き」がさらに深まる店を目指します。購入は公式サイトよりお願いいたします。`,
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
        draft: `【${productName}】${price}\n${keywords}が好きな方へ。状態・希少性・つくられた背景まで確かめ、${shopName}が理由を持って選んだアイテムです。詳細・ご購入は各ショップの公式ページからお願いいたします。`,
        model: "rule-v1"
      };
    }

    case "sns_post":
      return {
        draft: `📍 ${shopName}\n\n${categories}が好きな方へ。\n${keywords}の背景と価値を、「好きは、価値になる。」で発見できます。\n\n▶ プロフィールのリンクからチェック\n#好きは価値になる #${keywords.replace(/\s+/g, "")} #こだわり`,
        model: "rule-v1"
      };

    case "catch_copy":
      return {
        draft: [
          `${keywords}、ここから。`,
          `${categories}へのこだわりを届ける、${shopName}`,
          `知る人だけが辿り着く、${shopName}`
        ].join("\n"),
        model: "rule-v1"
      };

    default:
      return { draft: "", model: "rule-v1" };
  }
}
