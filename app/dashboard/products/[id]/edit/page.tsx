import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ProductForm } from "@/components/dashboard/product-form";
import { ProductLimitBanner } from "@/components/dashboard/product-limit-banner";
import { listCategories } from "@/lib/categories";
import { getProductLimitInfo, getSellerProduct } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { asRelatedList } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function DashboardProductEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard next={`/dashboard/products/${id}/edit`} /></div>;

  const [product, categories, limitInfo] = await Promise.all([
    getSellerProduct(supabase, id, userData.user.id),
    listCategories(supabase),
    getProductLimitInfo(supabase, userData.user.id)
  ]);
  if (!product) notFound();
  const tags = asRelatedList(product.product_tags).map((row) => row.tag);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard/products" className="text-sm font-semibold text-lagoon hover:text-cinnabar">← 商品一覧</Link>
      <h1 className="mt-2 text-4xl font-black">商品を編集</h1>
      <div className="mt-6"><ProductLimitBanner limitInfo={limitInfo} /></div>
      <section className="mt-8 rounded-xl border border-ink/10 bg-paper/95 p-6 shadow-sm">
        <ProductForm shopId={product.shop_id} categories={categories} mode="edit" product={{ id: product.id, name: product.name, description: product.description, image_url: product.image_url, external_url: product.external_url, category_id: product.category_id, status: product.status, tags }} />
      </section>
    </section>
  );
}