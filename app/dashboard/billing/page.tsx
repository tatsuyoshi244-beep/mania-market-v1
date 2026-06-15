import { AuthCard } from "@/components/auth-card";
import { PlanCards } from "@/components/plan-cards";
import { PLANS } from "@/lib/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return <div className="px-4 py-10"><AuthCard /></div>;

  const { data: user } = await supabase
    .from("users")
    .select("plan_key")
    .eq("id", userData.user.id)
    .single();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-black">プラン</h1>
      <p className="mt-2 text-ink/65">
        現在のプラン: {PLANS[user?.plan_key ?? "free"].name}
      </p>
      <p className="mt-2 text-sm text-ink/60">
        Phase 1 では決済機能は未実装です。プラン変更は管理者または将来の課金機能で対応します。
      </p>
      <div className="mt-8">
        <PlanCards currentPlan={user?.plan_key} />
      </div>
    </section>
  );
}
