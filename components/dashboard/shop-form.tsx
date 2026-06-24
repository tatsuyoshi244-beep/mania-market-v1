import { saveShop } from "@/app/actions";
import type { Shop } from "@/types/database";

type CategoryOption = { id: string; name: string };

type ShopFormProps = {
  shop?: Shop | null;
  categories: CategoryOption[];
  selectedCategoryIds: string[];
  readOnly?: boolean;
};

export function ShopForm({ shop, categories, selectedCategoryIds, readOnly = false }: ShopFormProps) {
  const selected = new Set(selectedCategoryIds);

  if (readOnly) {
    return (
      <div className="grid gap-4 rounded-xl border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div><p className="text-xs text-ink/50">ショップ名</p><p className="font-semibold">{shop?.name ?? "—"}</p></div>
          <div><p className="text-xs text-ink/50">slug</p><p className="font-semibold">{shop?.slug ?? "—"}</p></div>
        </div>
        <div><p className="text-xs text-ink/50">紹介文</p><p className="whitespace-pre-wrap text-sm">{shop?.description ?? "—"}</p></div>
        <div><p className="text-xs text-ink/50">所在地</p><p className="text-sm">{shop?.location ?? "—"}</p></div>
        <div><p className="text-xs text-ink/50">公開状態</p><p className="text-sm">{shop?.is_published ? "公開" : "非公開"}</p></div>
      </div>
    );
  }

  return (
    <form action={saveShop} className="grid gap-4 rounded-xl border border-ink/10 bg-paper/95 p-6 shadow-sm">
      {shop?.id ? <input type="hidden" name="shop_id" value={shop.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          ショップ名
          <input name="name" required defaultValue={shop?.name ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          slug
          <input name="slug" required defaultValue={shop?.slug ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" placeholder="rare-camera-lab" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        紹介文
        <textarea name="description" rows={5} defaultValue={shop?.description ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          ロゴ画像URL
          <input name="logo_url" type="url" defaultValue={shop?.logo_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          バナー画像URL
          <input name="cover_image_url" type="url" defaultValue={shop?.cover_image_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Webサイト
          <input name="website_url" type="url" defaultValue={shop?.website_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          所在地（任意）
          <input name="location" defaultValue={shop?.location ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" placeholder="東京都渋谷区" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Instagram
          <input name="instagram_url" type="url" defaultValue={shop?.instagram_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          X (Twitter)
          <input name="twitter_url" type="url" defaultValue={shop?.twitter_url ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2" />
        </label>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">カテゴリ</legend>
        <div className="grid gap-2 md:grid-cols-2">
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm">
              <input type="checkbox" name="category_ids" value={category.id} defaultChecked={selected.has(category.id)} />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input name="is_published" type="checkbox" defaultChecked={shop?.is_published ?? false} />
        公開する
      </label>
      <button className="w-fit rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-lagoon">保存</button>
    </form>
  );
}