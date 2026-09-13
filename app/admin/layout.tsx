import { AuthCard } from "@/components/auth-card";
import { AccessDenied } from "@/components/access-denied";
import { requireAdminUser } from "@/lib/partner-applications/admin";
import { getAuthUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/admin" title="管理画面" description="管理者としてログインしてください。" />
      </div>
    );
  }

  try {
    await requireAdminUser(user.id);
  } catch {
    return (
      <AccessDenied
        title="管理者専用"
        message="このページは users.role = admin のユーザーのみアクセスできます。"
        backHref="/"
      />
    );
  }

  return <>{children}</>;
}
