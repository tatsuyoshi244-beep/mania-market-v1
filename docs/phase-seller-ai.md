# Phase 4: 出店者向け AI 支援（設計メモ）

購入者向け **Mania Guide**（Phase 3.5）の後続フェーズとして、ダッシュボード内で出店者の文案生成を支援する。

## 方針

- 生成結果は **下書き** として提示し、出店者が編集・確定してから保存
- 会話ログは保存しない（購入者向け Guide と同様）
- 認証済み出店者のみ利用（`shops.owner_id = auth.uid()`）
- 生成 API は Server Action または `/api/seller/ai/*` に集約

## 機能一覧

### 1. AI ショップ紹介文生成

| 項目 | 内容 |
|------|------|
| 入力 | ショップ名、カテゴリ、キーワード、既存の短いメモ |
| 出力 | 説明文 120〜300 文字（トーン: マニア向け・専門性・熱量） |
| 保存先 | `shops.description` |
| UI | `/dashboard/shop` に「AIで下書き」ボタン |

### 2. AI 商品説明生成

| 項目 | 内容 |
|------|------|
| 入力 | 商品名、価格帯ラベル、状態メモ、カテゴリ文脈 |
| 出力 | 説明文 80〜200 文字 + 箇条書き特徴（任意） |
| 保存先 | `products.description` |
| UI | `/dashboard/products` の登録・編集フォーム |

### 3. AI タグ提案

| 項目 | 内容 |
|------|------|
| 入力 | 商品名、説明、ショップのカテゴリ |
| 出力 | タグ 3〜8 件（既存 `product_tags` と重複チェック） |
| 保存先 | `product_tags`（出店者承認後に insert） |
| UI | チップ選択 UI（提案タグをクリックで追加） |

## API 設計（案）

```
POST /api/seller/ai/shop-description
POST /api/seller/ai/product-description
POST /api/seller/ai/product-tags
```

リクエスト例:

```json
{
  "shopId": "uuid",
  "hints": { "tone": "enthusiastic", "keywords": ["film", "leica"] }
}
```

レスポンス例:

```json
{
  "draft": "生成テキスト…",
  "model": "mock-v1",
  "disclaimer": "内容は必ずご自身で確認してください"
}
```

## LLM 連携（将来）

| 段階 | 実装 |
|------|------|
| v1（本 Phase 前） | ルールベース / テンプレート（Mania Guide と同様） |
| v2 | OpenAI / Anthropic 等の API（`OPENAI_API_KEY`） |
| v3 | RAG: 同一カテゴリの人気ショップ・商品文面を参照 |

環境変数:

- `MANIA_AI_PROVIDER=mock|openai`
- `OPENAI_API_KEY`（v2 以降）

## セキュリティ・制限

- プラン別レート制限（free: 5回/日、standard: 30回/日 など）
- 入力サニタイズ（最大文字数、HTML 除去）
- 生成文に外部決済・購入保証を案内しない（購入者向け Guide と同じガードレール）
- `service_role` は Webhook 等のみ。出店者 AI は認証ユーザーの RLS 下で実行

## ダッシュボード UI ワイヤー

1. テキストエリア横に「✨ AI下書き」
2. クリック → ローディング → モーダルで下書き表示
3. 「反映」「再生成」「キャンセル」
4. タグは提案チップをタップで `product_tags` 入力欄に追加

## 依存関係

- Phase 1: shops / products / product_tags スキーマ（完了）
- Phase 3: 認証・ダッシュボード（完了）
- Phase 3.5: Mania Guide（購入者向け検索連携）— キーワード・カテゴリヒントを再利用可能

## 実装順序（推奨）

1. モック生成 + ダッシュボード UI（shop description）
2. product description + tags
3. プラン別レート制限
4. 本番 LLM 接続