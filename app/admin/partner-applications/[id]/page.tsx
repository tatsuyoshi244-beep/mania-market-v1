import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { PartnerApplicationDetail } from "@/components/admin/partner-application-detail";
import { PartnerApplicationStatusBadge } from "@/components/admin/partner-application-status";
import { getPartnerApplicationById, requireAdminUser } from "@/lib/partner-applications/admin";
import { getAuthUser } from "@/lib/auth";
import { queryOne } from "@/lib/neon/db";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPartnerApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  if (!user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next={`/admin/partner-applications/${id}`} />
      </div>
    );
  }

  try {
    await requireAdminUser(null, user.id);
  } catch {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-ink/10 bg-paper/95 p-6 shadow-sm">
          <h1 className="text-3xl font-black">管理者専用</h1>
          <p className="mt-3 text-ink/70">出店申請の管理には管理者権限が必要です。</p>
        </div>
      </section>
    );
  }

  const application = await getPartnerApplicationById(null, id);
  if (!application) notFound();

  let shopSlug: string | null = null;
  let shopOwnerId: string | null = null;
  let shopPendingOwnerEmail: string | null = null;
  if (application.shop_id) {
    const shop = await queryOne<{slug:string;owner_id:string|null;pending_owner_email:string|null}>(
      "select slug,owner_id,pending_owner_email from public.shops where id=$1", [application.shop_id]);
    shopSlug = shop?.slug ?? null;
    shopOwnerId = shop?.owner_id ?? null;
    shopPendingOwnerEmail = shop?.pending_owner_email ?? null;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/partner-applications" className="text-sm font-semibold text-lagoon hover:text-cinnabar">
            申請一覧
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold">申請詳細</h1>
            <PartnerApplicationStatusBadge status={application.status} />
          </div>
        </div>
      </div>

      <PartnerApplicationDetail
        application={application}
        shopSlug={shopSlug}
        shopOwnerId={shopOwnerId}
        shopPendingOwnerEmail={shopPendingOwnerEmail}
      />
    </section>
  );
}
