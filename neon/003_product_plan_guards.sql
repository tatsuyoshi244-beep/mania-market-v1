-- Mania Market: database-level product plan guards.
-- Run after 001_initial_schema.sql and 002_complete_platform.sql.

create or replace function public.enforce_product_plan_limit()
returns trigger
language plpgsql
as $$
declare
  allowed_products integer;
  current_products integer;
begin
  if new.seller_id is null then
    raise exception using errcode = '23514', message = 'seller_id is required';
  end if;

  -- Serialize product creation per seller so concurrent requests cannot bypass the limit.
  perform 1 from public.users where id = new.seller_id for update;

  select p.product_limit into allowed_products
  from public.users u
  join public.plans p on p.key = u.plan_key
  where u.id = new.seller_id;

  if not found then
    raise exception using errcode = '23503', message = 'seller plan was not found';
  end if;

  if allowed_products is null then
    return new;
  end if;

  select count(*)::integer into current_products
  from public.products
  where seller_id = new.seller_id;

  if current_products >= allowed_products then
    raise exception using errcode = '23514', message = 'product plan limit reached';
  end if;

  return new;
end;
$$;

drop trigger if exists products_enforce_plan_limit on public.products;
create trigger products_enforce_plan_limit
before insert on public.products
for each row execute function public.enforce_product_plan_limit();

create or replace function public.limit_active_products_after_plan_change()
returns trigger
language plpgsql
as $$
declare
  allowed_products integer;
begin
  if new.plan_key is not distinct from old.plan_key then
    return new;
  end if;

  select product_limit into allowed_products
  from public.plans
  where key = new.plan_key;

  if allowed_products is null then
    return new;
  end if;

  with ranked as (
    select id, row_number() over (order by created_at asc, id asc) as position
    from public.products
    where seller_id = new.id and status = 'active'
  )
  update public.products p
  set status = 'hidden', updated_at = now()
  from ranked r
  where p.id = r.id and r.position > allowed_products;

  return new;
end;
$$;

drop trigger if exists users_limit_active_products_after_plan_change on public.users;
create trigger users_limit_active_products_after_plan_change
after update of plan_key on public.users
for each row execute function public.limit_active_products_after_plan_change();

-- Reconcile shops that were already over their current plan when this migration was installed.
with ranked_products as (
  select p.id,
         pl.product_limit,
         row_number() over (partition by p.seller_id order by p.created_at asc, p.id asc) as position
  from public.products p
  join public.users u on u.id = p.seller_id
  join public.plans pl on pl.key = u.plan_key
  where p.status = 'active' and pl.product_limit is not null
)
update public.products p
set status = 'hidden', updated_at = now()
from ranked_products r
where p.id = r.id and r.position > r.product_limit;
