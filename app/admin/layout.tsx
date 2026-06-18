import { AuthCard } from "@/components/auth-card";
import { AccessDenied } from "@/components/access-denied";
import { requireAdminUser } from "@/lib/partner-applications/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/admin" title="管理画面" description="管理者としてログインしてください。" />
      </div>
    );
  }

  try {
    await requireAdminUser(supabase, userData.user.id);
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