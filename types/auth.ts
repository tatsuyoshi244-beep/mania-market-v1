import type { PlanKey, User, UserRole } from "@/types/database";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type AppUser = User;

export type AuthenticatedSession = {
  authUser: AuthUser;
  appUser: AppUser;
};

export type SellerSession = AuthenticatedSession & {
  appUser: AppUser & { role: "seller" | "admin" };
};

export type AdminSession = AuthenticatedSession & {
  appUser: AppUser & { role: "admin" };
};

export function isSellerRole(role: UserRole): role is "seller" | "admin" {
  return role === "seller" || role === "admin";
}

export function isAdminRole(role: UserRole): role is "admin" {
  return role === "admin";
}

export function isPlanKey(value: string | null | undefined): value is PlanKey {
  return value === "free" || value === "standard" || value === "premium";
}

export type ProductLimitInfo = {
  planKey: PlanKey;
  limit: number | null;
  productCount: number;
  remaining: number | null;
  canCreate: boolean;
};
