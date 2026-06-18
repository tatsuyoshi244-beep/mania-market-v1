import { redirect } from "next/navigation";
import type { Route } from "next";
import { requireAuth } from "@/lib/auth";
import { getOwnedShop } from "@/lib/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireDashboardSession(next: Route = "/dashboard") {
  const supabase = await createSupabaseServerClient();
  const authUser = await requireAuth(`/login?next=${encodeURIComponent(next)}` as Route);
  return { supabase, authUser };
}

export async function requireOwnedShopSession(next: Route = "/dashboard/products") {
  const { supabase, authUser } = await requireDashboardSession(next);
  const shop = await getOwnedShop(supabase, authUser.id);
  if (!shop) redirect("/dashboard");
  return { supabase, authUser, shop };
}