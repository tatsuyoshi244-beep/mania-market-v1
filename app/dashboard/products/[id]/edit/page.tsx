import Link from "next/link";
import { notFound } from "next/navigation";
import type { Route } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductForm } from "@/components/dashboard/product-form";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { listCategories } from "@/lib/categories";
import { requireOwnerDashboardAccess } from "@/lib/dashboard/access";
import { getProductLimitInfo, getSellerProduct } from "@/lib/products";
import { asRelatedList } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function DashboardProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const access = await requireOwnerDashboardAccess(`/dashboard/products/${id}/edit` as Route);
  const [product, categories, limitInfo] = await Promise.all([
    getSellerProduct(access.supabase, id, access.userId),
    listCategories(access.supabase),
    getProductLimitInfo(access.supabase, access.userId)
  ]);
  if (!product) notFound();
  const tags = asRelatedList(product.product_tags).map((row) => row.tag);

  return (
    <DashboardShell title="商品を編集" description="商品情報の更新と公開状態の変更" email={access.email} mode={access.mode} shopName={access.shop.name}>
      <Link href="/dashboard/products" className="text-sm font-semibold text-lagoon hover:text-cinnabar">← 商品一覧</Link>
      <div className="mt-4"><ProductLimitBanner limitInfo={limitInfo} /></div>
      <section className="mt-6 rounded-xl border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <ProductForm
          shopId={product.shop_id}
          categories={categories}
          mode="edit"
          product={{
            id: product.id,
            name: product.name,
            description: product.description,
            price_label: product.price_label,
            image_url: product.image_url,
            external_url: product.external_url,
            category_id: product.category_id,
            status: product.status,
            tags
          }}
        />
      </section>
    </DashboardShell>
  );
}