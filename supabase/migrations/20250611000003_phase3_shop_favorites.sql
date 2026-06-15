-- Phase 3: extend favorites for shop favorites (products + shops in one table)
alter table public.favorites
  alter column product_id drop not null,
  add column if not exists shop_id uuid references public.shops (id) on delete cascade;

alter table public.favorites drop constraint if exists favorites_pkey;

alter table public.favorites drop constraint if exists favorites_target_check;
alter table public.favorites add constraint favorites_target_check check (
  (product_id is not null and shop_id is null) or
  (product_id is null and shop_id is not null)
);

create unique index if not exists favorites_user_product_unique
  on public.favorites (user_id, product_id)
  where product_id is not null;

create unique index if not exists favorites_user_shop_unique
  on public.favorites (user_id, shop_id)
  where shop_id is not null;

create index if not exists favorites_shop_id_idx on public.favorites (shop_id);