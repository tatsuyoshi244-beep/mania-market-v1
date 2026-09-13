import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ShopCard } from "@/components/shop-card";
import { getCategoryImageUrl } from "@/lib/category-images";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { listProductsByCategory } from "@/lib/queries/products";
import { listShopsByCategory } from "@/lib/queries/shops";
import { getAuthUser } from "@/lib/auth";
import { getUserSocialState } from "@/lib/queries/social";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, compactDescription } from "@/lib/seo";
import { cache } from "react";

export const dynamic = "force-dynamic";
const getCachedCategory = cache(getCategoryBySlug);

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCachedCategory(slug);
  if (!category) return { title: "カテゴリが見つかりません", robots: { index: false, follow: false } };

  const description = compactDescription(
    category.description,
    `${category.name}の専門店とこだわり商品をマニアマーケットで探せます。`
  );
  const image = getCategoryImageUrl(slug);
  return {
    title: `${category.name}の専門店・商品`,
    description,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: { title: `${category.name}の専門店・商品`, description, url: `/categories/${slug}`, images: [image] },
    twitter: { card: "summary_large_image", title: `${category.name}の専門店・商品`, description, images: [image] }
  };
}

export default async function CategoryDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, user] = await Promise.all([getCachedCategory(slug), getAuthUser()]);
  if (!category) notFound();

  const [shops, products, social] = await Promise.all([
    listShopsByCategory(category.id),
    listProductsByCategory(category.id),
    getUserSocialState(user?.id)
  ]);

  const imageUrl = getCategoryImageUrl(slug);

  return (
    <section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              name: `${category.name}の専門店・商品`,
              description: compactDescription(category.description, `${category.name}の専門店と商品`),
              url: absoluteUrl(`/categories/${slug}`),
              inLanguage: "ja-JP"
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "カテゴリ", item: absoluteUrl("/categories") },
                { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(`/categories/${slug}`) }
              ]
            },
            {
              "@type": "ItemList",
              name: `${category.name}の商品`,
              itemListElement: products.slice(0, 20).map((product, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: product.name,
                url: absoluteUrl(`/products/${product.id}`)
              }))
            }
          ]
        }}
      />
      <div className="relative h-56 overflow-hidden sm:h-72 lg:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`${category.name}の専門ジャンル`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Category</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">{category.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{category.description}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <section>
          <h2 className="text-2xl font-black">このカテゴリのショップ</h2>
          {shops.length === 0 ? (
            <p className="mt-4 text-ink/60 dark:text-paper/60">ショップが見つかりません。</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  returnTo={`/categories/${slug}`}
                  isFavoriteShop={social.favoriteShopIds.has(shop.id)}
                  isFollowing={social.followingShopIds.has(shop.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-black">このカテゴリの商品</h2>
          {products.length === 0 ? (
            <p className="mt-4 text-ink/60 dark:text-paper/60">商品が見つかりません。</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorited={social.favoriteProductIds.has(product.id)}
                  returnTo={`/categories/${slug}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
