import { redirect } from "next/navigation";
import type { Route } from "next";
import type { Shop } from "@/types/database";
import { getAuthenticatedSession } from "@/lib/auth";
import { getOwnedShop } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardAccessMode = "owner" | "admin-readonly" | "seller-no-shop";

export type DashboardAccess = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  email: string | undefined;
  role: "buyer" | "seller" | "admin";
  shop: Shop | null;
  mode: DashboardAccessMode;
  canEdit: boolean;
  canView: boolean;
};

export async function getDashboardAccess(): Promise<DashboardAccess | null> {
  const session = await getAuthenticatedSession();
  if (!session) return null;

  const supabase = await createSupabaseServerClient();
  const role = session.appUser.role;
  const shop = await getOwnedShop(supabase, session.authUser.id);

  if (role === "buyer") {
    return {
      supabase,
      userId: session.authUser.id,
      email: session.authUser.email,
      role,
      shop,
      mode: "seller-no-shop",
      canEdit: false,
      canView: false
    };
  }

  const isOwner = Boolean(shop);
  const isAdmin = role === "admin";
  const mode: DashboardAccessMode = isOwner ? "owner" : isAdmin ? "admin-readonly" : "seller-no-shop";

  return {
    supabase,
    userId: session.authUser.id,
    email: session.authUser.email,
    role,
    shop,
    mode,
    canEdit: isOwner,
    canView: isOwner || isAdmin
  };
}

export async function requireDashboardAccess(next: Route = "/dashboard"): Promise<DashboardAccess> {
  const access = await getDashboardAccess();
  if (!access) redirect(`/login?next=${encodeURIComponent(next)}` as Route);
  if (!access.canView) {
    redirect("/mypage" as Route);
  }
  return access;
}

export async function requireOwnerDashboardAccess(next: Route = "/dashboard"): Promise<DashboardAccess & { shop: Shop }> {
  const access = await requireDashboardAccess(next);
  if (!access.shop || !access.canEdit) {
    redirect("/dashboard" as Route);
  }
  return access as DashboardAccess & { shop: Shop };
}