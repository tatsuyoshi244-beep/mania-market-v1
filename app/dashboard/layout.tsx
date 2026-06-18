import { AuthCard } from "@/components/auth-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/dashboard" title="出店ダッシュボード" description="ログインしてショップ管理を開始してください。" />
      </div>
    );
  }

  return <>{children}</>;
}