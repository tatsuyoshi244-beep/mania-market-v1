import Link from "next/link";
import type { Route } from "next";

type GettingStartedStepsProps = {
  hasProducts: boolean;
  hasShopProfile: boolean;
  hasSocialLinks: boolean;
  hasFollowers: boolean;
  isPremiumOrStandard: boolean;
  shopSlug?: string | null;
  readOnly?: boolean;
};

const STEPS = [
  { key: "products", title: "STEP1 商品登録", href: "/dashboard/products/new", cta: "商品を登録" },
  { key: "shop", title: "STEP2 ショップ編集", href: "/dashboard/shop", cta: "ショップを整える" },
  { key: "sns", title: "STEP3 SNS共有", href: null, cta: "公開ページを見る" },
  { key: "followers", title: "STEP4 フォロワー獲得", href: "/dashboard/analytics", cta: "アナリティクスを見る" },
  { key: "billing", title: "STEP5 プランアップグレード", href: "/dashboard/billing", cta: "プランを確認" }
] as const;

export function GettingStartedSteps(props: GettingStartedStepsProps) {
  const doneMap = {
    products: props.hasProducts,
    shop: props.hasShopProfile,
    sns: Boolean(props.shopSlug),
    followers: props.hasFollowers,
    billing: props.isPremiumOrStandard
  };

  return (
    <div className="grid gap-4">
      {STEPS.map((step) => {
        const done = doneMap[step.key];
        const href = step.key === "sns" && props.shopSlug ? (`/shops/${props.shopSlug}` as Route) : (step.href as Route | null);
        return (
          <section key={step.key} className="rounded-xl border border-ink/10 bg-paper/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">{step.title}</p>
                <p className="mt-1 text-sm text-ink/60">
                  {step.key === "products" && "まずは代表作を1件以上登録しましょう。"}
                  {step.key === "shop" && "紹介文・画像・SNSリンクを整えて信頼感を高めましょう。"}
                  {step.key === "sns" && "公開ページをSNSで共有して初期流入を作りましょう。"}
                  {step.key === "followers" && "フォロー・お気に入りを増やしてリピーターを育てましょう。"}
                  {step.key === "billing" && "商品数が増えたら上位プランで上限を広げましょう。"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${done ? "bg-moss/15 text-moss" : "bg-ink/8 text-ink/55"}`}>
                {done ? "完了" : "未完了"}
              </span>
            </div>
            {!props.readOnly && href ? (
              <Link href={href} className="mt-4 inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm font-bold hover:border-cinnabar">
                {step.cta}
              </Link>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}