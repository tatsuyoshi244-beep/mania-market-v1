-- Phase 4: 出店申請 → 審査 → 公開

alter table public.partner_applications
  add column if not exists approved_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists shop_id uuid;

alter table public.shops
  alter column owner_id drop not null;

alter table public.shops
  add column if not exists status text not null default 'active',
  add column if not exists partner_application_id uuid,
  add column if not exists pending_owner_email text,
  add column if not exists plan_key public.plan_key not null default 'free';

alter table public.shops drop constraint if exists shops_status_check;
alter table public.shops add constraint shops_status_check
  check (status in ('draft', 'pending_owner', 'active', 'suspended'));

update public.shops
set status = case when is_published then 'active' else 'draft' end
where status is null or status = 'active';

alter table public.partner_applications
  drop constraint if exists partner_applications_shop_id_fkey;
alter table public.partner_applications
  add constraint partner_applications_shop_id_fkey
  foreign key (shop_id) references public.shops (id) on delete set null;

alter table public.shops
  drop constraint if exists shops_partner_application_id_fkey;
alter table public.shops
  add constraint shops_partner_application_id_fkey
  foreign key (partner_application_id) references public.partner_applications (id) on delete set null;

create unique index if not exists shops_partner_application_id_unique
  on public.shops (partner_application_id)
  where partner_application_id is not null;

create index if not exists shops_status_is_published_idx
  on public.shops (status, is_published, created_at desc);

create or replace function public.user_id_by_email(target_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(target_email) limit 1;
$$;

revoke all on function public.user_id_by_email(text) from public;
grant execute on function public.user_id_by_email(text) to service_role;

drop policy if exists "shops public read published" on public.shops;
create policy "shops public read published" on public.shops
for select using (
  (is_published and status = 'active')
  or owner_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "shops owner insert own" on public.shops;
create policy "shops owner insert own" on public.shops
for insert with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "shops owner update own" on public.shops;
create policy "shops owner update own" on public.shops
for update using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());