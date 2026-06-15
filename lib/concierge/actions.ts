import type { Route } from "next";
import type { ConciergeActions, ConciergeContext, ShopDiagnosis } from "@/types/concierge";

export function buildConciergeActions(context: ConciergeContext, diagnosis: ShopDiagnosis): ConciergeActions {
  const missing = diagnosis.items.filter((item) => !item.done).map((item) => item.label);

  const today: ConciergeActions["today"] = [];

  if (!context.shop) {
    today.push({
      id: "create-shop",
      label: "ショップを新規作成する",
      priority: "high",
      href: "/dashboard" as Route
    });
  } else {
    for (const item of diagnosis.items.filter((row) => !row.done)) {
      today.push({
        id: item.key,
        label: item.label,
        priority: item.weight >= 15 ? "high" : item.weight >= 10 ? "medium" : "low",
        href: item.href
      });
    }

    if (context.activeProductCount < 3) {
      today.push({
        id: "add-products",
        label: "商品をあと2〜3点追加してショップを充実させる",
        priority: "medium",
        href: "/dashboard/products" as Route
      });
    }
  }

  const prioritized = today
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 } as const;
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 5);

  const nextIncomplete = diagnosis.items.find((item) => !item.done);
  const nextAction = nextIncomplete?.href
    ? {
        label: nextIncomplete.label,
        description: `完成度を上げるには「${nextIncomplete.label}」を完了させましょう。`,
        href: nextIncomplete.href
      }
    : context.shop?.is_published
      ? {
          label: "SNSでショップを紹介",
          description: "完成度は十分です。SNS投稿文を生成して集客を始めましょう。",
          href: "/dashboard/concierge" as Route
        }
      : {
          label: "ショップを公開する",
          description: "準備が整いました。公開設定をオンにして発見されやすくしましょう。",
          href: "/dashboard" as Route
        };

  return {
    today: prioritized,
    missing,
    nextAction
  };
}