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
- Supabase Auth / PostgreSQL / RLS
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
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_STANDARD_PRICE_ID=price_xxxxx
STRIPE_PREMIUM_PRICE_ID=price_xxxxx
```

## Supabase マイグレーション

Supabase CLI を使う場合:

```bash
supabase link --project-ref <project-ref>
supabase db push --include-all
```

SQL Editor で実行する場合は [supabase/001_initial_schema.sql](supabase/001_initial_schema.sql) を開き、全文を実行してください。

このマイグレーションには以下が含まれます。

- `profiles`, `shops`, `products`, `favorites`, `follows`, `analytics_events`
- RLS ポリシー
- 出店者が自分のショップと商品だけ編集できる制御
- 管理者が全件を読める制御
- 商品数上限の DB トリガー
- 無料プラン降格時に作成日順で3件だけ `active`、4件目以降を `hidden` にする関数

管理者を作るには、対象ユーザー作成後に SQL Editor で以下を実行します。

```sql
update public.profiles
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

Webhook で購読状態が Supabase `profiles` に同期されます。解約、支払い失敗、非アクティブ化時は無料プランへ戻し、商品表示状態を制限に合わせて同期します。

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

## 分析イベント

`analytics_events` に以下を記録します。

- `shop_view`
- `product_view`
- `favorite_add`
- `follow_add`
- `external_click`

外部リンクは `/api/external-click` 経由で `external_click` を記録してから販売サイトへリダイレクトします。
