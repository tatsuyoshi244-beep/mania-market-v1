import { redirect } from "next/navigation";
import type { Route } from "next";
import { requireAuth } from "@/lib/auth";
import { getOwnedShop } from "@/lib/products";

export async function requireDashboardSession(next: Route = "/dashboard") {
  const authUser = await requireAuth(next);
  return { authUser };
}

export async function requireOwnedShopSession(next: Route = "/dashboard/products") {
  const { authUser } = await requireDashboardSession(next);
  const shop = await getOwnedShop(authUser.id);
  if (!shop) redirect("/dashboard");
  return { authUser, shop };
}
