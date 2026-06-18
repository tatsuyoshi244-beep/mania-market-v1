-- Phase 6: product category + plan limit (active + draft)

alter table public.products
  add column if not exists category_id uuid;

alter table public.products
  drop constraint if exists products_category_id_fkey;

alter table public.products
  add constraint products_category_id_fkey
  foreign key (category_id) references public.categories (id) on delete set null;

create index if not exists products_category_id_idx
  on public.products (category_id);

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seller_plan public.plan_key;
  allowed_count integer;
  used_count integer;
begin
  if new.status not in ('active', 'hidden') then
    return new;
  end if;

  select plan_key into seller_plan from public.users where id = new.seller_id;
  allowed_count := public.plan_product_limit(seller_plan);

  if allowed_count is null then
    return new;
  end if;

  select count(*) into used_count
  from public.products
  where seller_id = new.seller_id
    and status in ('active', 'hidden')
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if used_count >= allowed_count then
    raise exception 'product limit exceeded for plan %', seller_plan;
  end if;

  return new;
end;
$$;

create or replace function public.sync_product_visibility_for_plan(target_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  seller_plan public.plan_key;
  allowed_count integer;
begin
  select plan_key into seller_plan from public.users where id = target_seller_id;
  allowed_count := public.plan_product_limit(seller_plan);

  if allowed_count is null then
    return;
  end if;

  with ranked as (
    select id, row_number() over (order by created_at asc, id asc) as rn
    from public.products
    where seller_id = target_seller_id
      and status in ('active', 'hidden')
  )
  update public.products p
  set status = 'hidden'
  from ranked
  where p.id = ranked.id
    and ranked.rn > allowed_count
    and p.status = 'active';
end;
$$;