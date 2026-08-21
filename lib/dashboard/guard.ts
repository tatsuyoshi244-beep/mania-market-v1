import { redirect } from "next/navigation";
import type { Route } from "next";
import { requireAuth } from "@/lib/auth";
import { getOwnedShop } from "@/lib/products";

export async function requireDashboardSession(next: Route = "/dashboard") {
  const authUser = await requireAuth(`/login?next=${encodeURIComponent(next)}` as Route);
  return { supabase: null as never, authUser };
}

export async function requireOwnedShopSession(next: Route = "/dashboard/products") {
  const { supabase, authUser } = await requireDashboardSession(next);
  const shop = await getOwnedShop(supabase, authUser.id);
  if (!shop) redirect("/dashboard");
  return { supabase, authUser, shop };
}
