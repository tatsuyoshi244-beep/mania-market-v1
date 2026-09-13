# Mania Market v1.0

マニア専門店発見プラットフォームです。購入者はショップと商品を検索し、お気に入り・フォローを行い、外部販売サイトへ遷移します。出店者はショップページと商品ページを作成できます。

v1.0 の対象外:

- サイト内決済
- チャット
- レビュー
- コメント
- オークション
- ポイント制度
- 配送管理
- 返品管理

## 技術スタック

- Next.js App Router
- TypeScript
- Neon Auth / Neon PostgreSQL
- Tailwind CSS
- Stripe Billing Checkout / Customer Portal / Webhook

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

PowerShell の実行ポリシーで `npm` が止まる場合は `npm.cmd install` のように `.cmd` を使ってください。

## 環境変数

`.env.local` を作成してください。

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://...
VITE_NEON_AUTH_URL=https://...
NEON_AUTH_BASE_URL=https://...
NEON_AUTH_COOKIE_SECRET=32文字以上のランダムな文字列

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STANDARD_PRICE_ID=price_xxxxx
STRIPE_PREMIUM_PRICE_ID=price_xxxxx
```

## Neon マイグレーション

パートナー営業CRMと流入計測を有効にする場合は、既存の移行SQLに続けて `neon/005_partner_growth.sql` を実行してください。

Neon SQL Editor で [neon/001_initial_schema.sql](neon/001_initial_schema.sql)、
[neon/002_complete_platform.sql](neon/002_complete_platform.sql)、
[neon/003_product_plan_guards.sql](neon/003_product_plan_guards.sql) の順に実行してください。

このマイグレーションには以下が含まれます。

- `users`, `shops`, `products`, `favorites`, `follows`, `analytics_events`
- サーバー側の所有者・管理者権限確認
- 商品数上限の DB トリガー
- 無料プラン降格時に作成日順で3件だけ `active`、4件目以降を `hidden` にする関数

管理者を作るには、対象ユーザー作成後に SQL Editor で以下を実行します。

```sql
update public.users
set role = 'admin'
where id = '<user-id>';
```

## Stripe 設定

1. Stripe Dashboard で商品を2つ作成します。
   - スタンダード: 月額980円
   - プレミアム: 月額4,980円
2. それぞれの recurring Price ID を `.env.local` の `STRIPE_STANDARD_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID` に設定します。
3. Customer Portal を有効化し、プラン変更・解約・請求情報管理を許可します。
4. Webhook endpoint に以下を登録します。

```text
https://<your-domain>/api/stripe/webhook
```

ローカル開発では Stripe CLI を使えます。

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Webhook で購読状態が Neon `users` / `subscriptions` に同期されます。解約、支払い失敗、非アクティブ化時は無料プランへ戻します。

## 主要ルート

- `/` トップ
- `/shops` ショップ検索
- `/shops/[slug]` ショップ詳細
- `/products` 商品検索
- `/products/[id]` 商品詳細
- `/dashboard` 出店者ダッシュボード
- `/dashboard/products` 商品管理
- `/dashboard/billing` Stripe 課金管理
- `/admin` 管理者ビュー
- `/api/health` DB・認証・Stripe設定の稼働確認（秘密情報は返しません）

## 分析イベント

`analytics_events` に以下を記録します。

- `shop_view`
- `product_view`
- `favorite_add`
- `follow_add`
- `external_click`

外部リンクは `/api/external-click` 経由で `external_click` を記録してから販売サイトへリダイレクトします。
