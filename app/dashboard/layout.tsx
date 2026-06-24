import { AuthCard } from "@/components/auth-card";
import { AccessDenied } from "@/components/access-denied";
import { getDashboardAccess } from "@/lib/dashboard/access";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getDashboardAccess();

  if (!access) {
    return (
      <div className="px-4 py-10">
        <AuthCard next="/dashboard" title="出店ダッシュボード" description="ログインしてショップ管理を開始してください。" />
      </div>
    );
  }

  if (!access.canView) {
    return (
      <AccessDenied
        title="出店者ダッシュボード"
        message="このエリアはショップオーナーまたは管理者のみアクセスできます。出店をご希望の場合は出店申請から始めてください。"
        backHref="/mypage"
        backLabel="マイページへ"
      />
    );
  }

  return <>{children}</>;
}