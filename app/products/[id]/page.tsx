import { ExternalLink, Instagram, Store } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FavoriteProductButton } from "@/components/favorite-product-button";
import { getProductById } from "@/lib/queries/products";
import { asRelatedList } from "@/lib/utils";
import { getAuthUser } from "@/lib/auth";
import { getUserSocialState } from "@/lib/queries/social";
import { AnalyticsView } from "@/components/analytics-view";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, compactDescription } from "@/lib/seo";
import { cache } from "react";

export const dynamic = "force-dynamic";
const getCachedProduct = cache(getProductById);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getCachedProduct(id);
  if (!product) return { title: "商品が見つかりません", robots: { index: false, follow: false } };

  const shopName = product.shops?.name;
  const description = compactDescription(
    product.description,
    `${product.name}${shopName ? `を扱う${shopName}` : ""}の商品情報です。`
  );
  const images = product.image_url ? [product.image_url] : [];
  return {
    title: `${product.name}${shopName ? `｜${shopName}` : ""}`,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: { title: product.name, description, type: "website", url: `/products/${id}`, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title: product.name, description, images }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, user] = await Promise.all([getCachedProduct(id), getAuthUser()]);
  if (!product) notFound();

  const social = await getUserSocialState(user?.id);
  const returnTo = `/products/${id}`;

  const tags = asRelatedList(product.product_tags).map((row) => row.tag);
  const shop = product.shops;

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.95fr_1.05fr]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              "@id": absoluteUrl(`/products/${id}#product`),
              name: product.name,
              description: compactDescription(product.description, `${product.name}の商品情報`),
              image: product.image_url ? [product.image_url] : undefined,
              category: product.category_slug || undefined,
              keywords: tags.length ? tags.join(", ") : undefined,
              brand: shop ? { "@type": "Brand", name: shop.name } : undefined,
              url: absoluteUrl(`/products/${id}`)
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "商品", item: absoluteUrl("/products") },
                { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/products/${id}`) }
              ]
            }
          ]
        }}
      />
      <AnalyticsView type="product_view" productId={product.id} />
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/90 shadow-sm dark:border-paper/10 dark:bg-ink/60">
        <div className="aspect-square bg-lagoon/15">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/50 dark:text-paper/50">No image</div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-ink/10 bg-white/90 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
          {tags.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-lagoon/10 px-3 py-1 text-xs font-semibold text-lagoon"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
          <h1 className="mt-3 text-4xl font-black">{product.name}</h1>
          <p className="mt-4 text-2xl font-black text-cinnabar">{product.price_label ?? "価格は販売先で確認"}</p>
          <p className="mt-5 leading-8 text-ink/75 dark:text-paper/75">{product.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <FavoriteProductButton
              productId={product.id}
              active={social.favoriteProductIds.has(product.id)}
              returnTo={returnTo}
              variant="text"
            />
            <a
              href={`/api/external-click?productId=${product.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-semibold text-white hover:bg-lagoon dark:bg-lagoon"
            >
              <ExternalLink className="size-4" />
              外部サイトで購入
            </a>
          </div>
        </div>

        {shop ? (
          <div className="rounded-2xl border border-ink/10 bg-white/90 p-6 shadow-sm dark:border-paper/10 dark:bg-ink/60">
            <h2 className="text-xl font-black">ショップ情報</h2>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border border-ink/10 bg-white">
                {shop.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logo_url} alt={`${shop.name}のロゴ`} className="h-full w-full object-cover" />
                ) : (
                  <Store className="size-6 text-moss" />
                )}
              </div>
              <div>
                <Link href={`/shops/${shop.slug}`} className="text-lg font-bold hover:text-cinnabar">
                  {shop.name}
                </Link>
                <p className="mt-2 line-clamp-3 text-sm text-ink/70 dark:text-paper/70">{shop.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/shops/${shop.slug}`} className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold dark:border-paper/15">
                    ショップを見る
                  </Link>
                  {shop.website_url ? (
                    <a href={shop.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold dark:border-paper/15">
                      <ExternalLink className="size-4" />
                      公式サイト
                    </a>
                  ) : null}
                  {shop.instagram_url ? (
                    <a href={shop.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold dark:border-paper/15">
                      <Instagram className="size-4" />
                      Instagram
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
