import Link from "next/link";
import { submitPartnerApplication } from "@/app/actions";

type PartnerApplyFormProps = {
  categories: Array<{ id: string; name: string }>;
  defaultEmail?: string | null;
};

export function PartnerApplyForm({ categories, defaultEmail }: PartnerApplyFormProps) {
  return (
    <form action={submitPartnerApplication} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          ショップ名 <span className="text-cinnabar">*</span>
          <input name="shop_name" required className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          運営者名 <span className="text-cinnabar">*</span>
          <input name="owner_name" required className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          メールアドレス <span className="text-cinnabar">*</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail ?? ""}
            className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          活動地域
          <input name="region" placeholder="例: 東京都 / オンラインのみ" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium">
          公式サイト
          <input name="website_url" type="url" placeholder="https://" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Instagram
          <input name="instagram_url" type="url" placeholder="https://instagram.com/..." className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          X (Twitter)
          <input name="x_url" type="url" placeholder="https://x.com/..." className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        ショップ説明 <span className="text-cinnabar">*</span>
        <textarea name="description" required rows={4} placeholder="どんな専門店か、扱うジャンルや強みを教えてください" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        想い
        <textarea name="mission" rows={3} placeholder="このショップを始めた理由や、大切にしていること" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        届けたい相手
        <textarea name="target_user" rows={2} placeholder="例: フィルムカメラに興味を持ち始めた人、コレクター" className="rounded-xl border border-ink/12 bg-white px-3 py-2.5 dark:border-paper/15 dark:bg-ink/50" />
      </label>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">
          カテゴリ <span className="text-cinnabar">*</span>（複数選択可）
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm dark:border-paper/15 dark:bg-ink/50"
            >
              <input type="checkbox" name="categories" value={category.name} />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl border border-ink/10 bg-ink/5 p-4 text-sm dark:border-paper/15 dark:bg-paper/5">
        <input type="checkbox" name="terms_agreed" required className="mt-1" />
        <span>
          <Link href="/seller-guide" className="font-semibold text-lagoon hover:text-cinnabar">
            出店ガイド・利用規約（要約）
          </Link>
          を確認し、掲載内容の正確性と法令遵守に同意します。
        </span>
      </label>

      <button
        type="submit"
        className="w-fit rounded-full bg-ink px-8 py-3.5 text-sm font-bold text-white shadow-editorial transition hover:bg-lagoon dark:bg-lagoon dark:hover:bg-cinnabar"
      >
        出店申請を送信する
      </button>
    </form>
  );
}