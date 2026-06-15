import { redirect } from "next/navigation";
import type { Route } from "next";
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthenticatedSession, SellerSession } from "@/types/auth";
import type { Database } from "@/types/database";

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireAuth(redirectTo: Route = "/dashboard"): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function getAppUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const appUser = await getAppUser(supabase, data.user.id);
  if (!appUser) return null;

  return { authUser: data.user, appUser };
}

export async function requireAuthenticatedSession(
  redirectTo: Route = "/dashboard"
): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession();
  if (!session) redirect(redirectTo);
  return session;
}

export async function requireSellerSession(
  redirectTo: Route = "/dashboard"
): Promise<SellerSession> {
  const session = await requireAuthenticatedSession(redirectTo);
  if (session.appUser.role !== "seller" && session.appUser.role !== "admin") {
    redirect(redirectTo);
  }
  return session as SellerSession;
}

export async function ensureAppUser(
  supabase: SupabaseClient<Database>,
  authUser: AuthUser
) {
  const existing = await getAppUser(supabase, authUser.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: authUser.id,
      display_name: authUser.email?.split("@")[0] ?? null
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** buyer/seller -> seller, admin -> admin */
export async function upsertSellerRolePreservingAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
  fields?: { display_name?: string | null }
) {
  const existing = await getAppUser(supabase, userId);
  const role = existing?.role === "admin" ? "admin" : "seller";

  const { error } = await supabase.from("users").upsert(
    {
      id: userId,
      role,
      ...fields
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}