-- Phase 5 fix: admin role preserved on shop owner claim / assign

create or replace function public.claim_pending_shop(target_shop_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_shop public.shops%rowtype;
begin
  if v_uid is null then
    raise exception 'ログインが必要です。';
  end if;

  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    raise exception 'メールアドレスが確認できません。';
  end if;

  select * into v_shop from public.shops where id = target_shop_id for update;
  if not found then
    raise exception 'ショップが見つかりません。';
  end if;

  if v_shop.owner_id is not null then
    raise exception 'このショップはすでにオーナーがいます。';
  end if;

  if v_shop.pending_owner_email is null
    or lower(v_shop.pending_owner_email) <> v_email then
    raise exception 'このショップを引き継ぐ権限がありません。';
  end if;

  update public.shops
  set owner_id = v_uid,
      pending_owner_email = null,
      updated_at = now()
  where id = target_shop_id;

  update public.partner_applications
  set pending_owner_email = null,
      updated_at = now()
  where shop_id = target_shop_id;

  insert into public.users (id, role, display_name)
  values (
    v_uid,
    'seller',
    (select split_part(email, '@', 1) from auth.users where id = v_uid)
  )
  on conflict (id) do update
  set role = case
    when users.role = 'admin'::public.user_role then 'admin'::public.user_role
    else 'seller'::public.user_role
  end;

  return target_shop_id;
end;
$$;

revoke all on function public.claim_pending_shop(uuid) from public;
grant execute on function public.claim_pending_shop(uuid) to authenticated;

create or replace function public.admin_assign_shop_owner(target_shop_id uuid, target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_shop public.shops%rowtype;
begin
  if not public.is_admin() then
    raise exception '管理者権限が必要です。';
  end if;

  if target_user_id is null then
    raise exception '紐付け先ユーザーが指定されていません。';
  end if;

  select * into v_shop from public.shops where id = target_shop_id for update;
  if not found then
    raise exception 'ショップが見つかりません。';
  end if;

  if v_shop.owner_id is not null then
    raise exception 'このショップはすでにオーナーがいます。';
  end if;

  update public.shops
  set owner_id = target_user_id,
      pending_owner_email = null,
      updated_at = now()
  where id = target_shop_id;

  update public.partner_applications
  set pending_owner_email = null,
      updated_at = now()
  where shop_id = target_shop_id;

  insert into public.users (id, role)
  values (target_user_id, 'seller')
  on conflict (id) do update
  set role = case
    when users.role = 'admin'::public.user_role then 'admin'::public.user_role
    else 'seller'::public.user_role
  end;

  return target_shop_id;
end;
$$;

revoke all on function public.admin_assign_shop_owner(uuid, uuid) from public;
grant execute on function public.admin_assign_shop_owner(uuid, uuid) to authenticated;