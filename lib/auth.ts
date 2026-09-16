import { redirect } from "next/navigation";
import type { Route } from "next";
import { getNeonAuth } from "@/lib/neon/auth";
import { isOwnerAdminEmail } from "@/lib/admin-identity";
import { queryOne } from "@/lib/neon/db";
import type { AuthUser, AuthenticatedSession, SellerSession } from "@/types/auth";
import type { User } from "@/types/database";

export async function getAuthUser(): Promise<AuthUser | null> {
  const { data: session } = await getNeonAuth().getSession();
  if (!session?.user?.id || !session.user.email) return null;
  return { id: session.user.id, email: session.user.email, name: session.user.name, image: session.user.image };
}

export async function requireAuth(redirectTo: Route = "/dashboard"): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(redirectTo)}` as Route);
  return user;
}

export async function getAppUser(userId: string) {
  return queryOne<User>("select * from public.users where id = $1", [userId]);
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  const appUser = await ensureAppUser(authUser);
  return { authUser, appUser };
}

export async function requireAuthenticatedSession(redirectTo: Route = "/dashboard") {
  const session = await getAuthenticatedSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(redirectTo)}` as Route);
  return session;
}

export async function requireSellerSession(redirectTo: Route = "/dashboard"): Promise<SellerSession> {
  const session = await requireAuthenticatedSession(redirectTo);
  if (session.appUser.role !== "seller" && session.appUser.role !== "admin") redirect(redirectTo);
  return session as SellerSession;
}

export async function ensureAppUser(authUser: AuthUser) {
  const isOwnerAdmin = isOwnerAdminEmail(authUser.email);
  const user = await queryOne<User>(
    `insert into public.users (id, email, display_name, role)
     values ($1, $2, $3,
       case when $4::boolean then 'admin'::public.user_role else 'buyer'::public.user_role end)
     on conflict (id) do update set email = excluded.email,
       display_name = coalesce(public.users.display_name, excluded.display_name),
       role = case
         when $4::boolean then 'admin'::public.user_role
         else public.users.role
       end,
       updated_at = now()
     returning *`,
    [authUser.id, authUser.email, authUser.name ?? authUser.email.split("@")[0], isOwnerAdmin]
  );
  if (!user) throw new Error("ユーザー情報を作成できませんでした。");
  return user;
}

export async function upsertSellerRolePreservingAdmin(
  userId: string,
  fields?: { display_name?: string | null }
) {
  await queryOne(
    `update public.users set
       role = case when role = 'admin' then 'admin'::public.user_role else 'seller'::public.user_role end,
       display_name = coalesce($2, display_name), updated_at = now()
     where id = $1 returning id`,
    [userId, fields?.display_name ?? null]
  );
}
