-- Mania Market v1.0 Phase 1
-- Complete initial schema for Supabase
--
-- Tables:
--   users, plans, shops, categories, shop_categories, products, product_tags,
--   favorites, follows, analytics_events, subscriptions, billing_events, ads

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('buyer', 'seller', 'admin');
create type public.plan_key as enum ('free', 'standard', 'premium');
create type public.product_status as enum ('active', 'hidden');
create type public.subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused'
);
create type public.billing_event_type as enum (
  'subscription_created',
  'subscription_updated',
  'subscription_canceled',
  'payment_succeeded',
  'payment_failed',
  'checkout_completed'
);
create type public.ad_placement as enum ('home_banner', 'search_sidebar', 'shop_detail');

-- ---------------------------------------------------------------------------
-- plans
-- ---------------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  key public.plan_key not null,
  name text not null,
  monthly_price integer not null default 0 check (monthly_price >= 0),
  product_limit integer check (product_limit is null or product_limit > 0),
  stripe_price_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_key_unique unique (key)
);

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

create table public.users (
  id uuid primary key,
  role public.user_role not null default 'buyer',
  display_name text,
  avatar_url text,
  plan_key public.plan_key not null default 'free',
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint users_plan_key_fkey foreign key (plan_key) references public.plans (key),
  constraint users_stripe_customer_id_unique unique (stripe_customer_id)
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_unique unique (slug),
  constraint categories_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  slug text not null,
  name text not null,
  description text,
  website_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shops_owner_id_fkey foreign key (owner_id) references public.users (id) on delete cascade,
  constraint shops_slug_unique unique (slug),
  constraint shops_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint shops_website_url_check check (website_url is null or website_url ~ '^https?://')
);

-- ---------------------------------------------------------------------------
-- shop_categories
-- ---------------------------------------------------------------------------

create table public.shop_categories (
  shop_id uuid not null,
  category_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_categories_pkey primary key (shop_id, category_id),
  constraint shop_categories_shop_id_fkey foreign key (shop_id) references public.shops (id) on delete cascade,
  constraint shop_categories_category_id_fkey foreign key (category_id) references public.categories (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  seller_id uuid not null,
  name text not null,
  description text,
  price_label text,
  external_url text not null,
  image_url text,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_shop_id_fkey foreign key (shop_id) references public.shops (id) on delete cascade,
  constraint products_seller_id_fkey foreign key (seller_id) references public.users (id) on delete cascade,
  constraint products_external_url_check check (external_url ~ '^https?://'),
  constraint products_image_url_check check (image_url is null or image_url ~ '^https?://')
);

-- ---------------------------------------------------------------------------
-- product_tags
-- ---------------------------------------------------------------------------

create table public.product_tags (
  product_id uuid not null,
  tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_tags_pkey primary key (product_id, tag),
  constraint product_tags_product_id_fkey foreign key (product_id) references public.products (id) on delete cascade,
  constraint product_tags_tag_format_check check (tag = lower(trim(tag)) and length(tag) > 0)
);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------

create table public.favorites (
  user_id uuid not null,
  product_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint favorites_pkey primary key (user_id, product_id),
  constraint favorites_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint favorites_product_id_fkey foreign key (product_id) references public.products (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------

create table public.follows (
  user_id uuid not null,
  shop_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follows_pkey primary key (user_id, shop_id),
  constraint follows_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint follows_shop_id_fkey foreign key (shop_id) references public.shops (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid,
  shop_id uuid,
  product_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_events_event_type_check check (
    event_type in ('shop_view', 'product_view', 'favorite_add', 'follow_add', 'external_click')
  ),
  constraint analytics_events_user_id_fkey foreign key (user_id) references public.users (id) on delete set null,
  constraint analytics_events_shop_id_fkey foreign key (shop_id) references public.shops (id) on delete set null,
  constraint analytics_events_product_id_fkey foreign key (product_id) references public.products (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null,
  status public.subscription_status not null default 'incomplete',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint subscriptions_plan_id_fkey foreign key (plan_id) references public.plans (id),
  constraint subscriptions_stripe_subscription_id_unique unique (stripe_subscription_id)
);

-- ---------------------------------------------------------------------------
-- billing_events
-- ---------------------------------------------------------------------------

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  subscription_id uuid,
  event_type public.billing_event_type not null,
  stripe_event_id text,
  amount integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_events_user_id_fkey foreign key (user_id) references public.users (id) on delete set null,
  constraint billing_events_subscription_id_fkey foreign key (subscription_id) references public.subscriptions (id) on delete set null,
  constraint billing_events_amount_check check (amount is null or amount >= 0)
);

-- ---------------------------------------------------------------------------
-- ads
-- ---------------------------------------------------------------------------

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  link_url text not null,
  placement public.ad_placement not null default 'home_banner',
  is_active boolean not null default false,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ads_image_url_check check (image_url is null or image_url ~ '^https?://'),
  constraint ads_link_url_check check (link_url ~ '^https?://')
);

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

insert into public.plans (key, name, monthly_price, product_limit, sort_order) values
  ('free', '無料', 0, 3, 1),
  ('standard', 'スタンダード', 980, 30, 2),
  ('premium', 'プレミアム', 4980, null, 3);

insert into public.categories (slug, name, description, sort_order) values
  ('vintage-camera', 'ヴィンテージカメラ', 'フィルムカメラ、レンズ、関連アクセサリー', 1),
  ('collectible-toys', 'コレクタブルトイ', 'フィギュア、トイ、限定グッズ', 2),
  ('retro-games', 'レトロゲーム', '家庭用ゲーム機、ソフト、周辺機器', 3),
  ('designer-vintage', 'デザイナーヴィンテージ', 'アパレル、バッグ、小物', 4),
  ('analog-audio', 'アナログオーディオ', 'レコード、プレーヤー、オーディオ機器', 5),
  ('outdoor-gear', 'アウトドアギア', 'キャンプ、登山、ヴィンテージアウトドア', 6);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index plans_sort_order_idx on public.plans (sort_order);

create index users_role_idx on public.users (role);
create index users_plan_key_idx on public.users (plan_key);
create index users_created_at_idx on public.users (created_at desc);

create index categories_sort_order_idx on public.categories (sort_order);

create index shops_owner_id_idx on public.shops (owner_id);
create index shops_is_published_created_at_idx on public.shops (is_published, created_at desc);
create index shops_search_idx on public.shops using gin (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
);

create index shop_categories_category_id_idx on public.shop_categories (category_id);
create index shop_categories_shop_id_idx on public.shop_categories (shop_id);

create index products_shop_id_status_created_at_idx on public.products (shop_id, status, created_at desc);
create index products_seller_id_status_created_at_idx on public.products (seller_id, status, created_at desc);
create index products_status_created_at_idx on public.products (status, created_at desc);
create index products_search_idx on public.products using gin (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
);

create index product_tags_tag_idx on public.product_tags (tag);
create index product_tags_product_id_idx on public.product_tags (product_id);

create index favorites_product_id_idx on public.favorites (product_id);
create index favorites_user_id_created_at_idx on public.favorites (user_id, created_at desc);

create index follows_shop_id_idx on public.follows (shop_id);
create index follows_user_id_created_at_idx on public.follows (user_id, created_at desc);

create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_event_type_created_at_idx on public.analytics_events (event_type, created_at desc);
create index analytics_events_user_id_idx on public.analytics_events (user_id);
create index analytics_events_shop_id_idx on public.analytics_events (shop_id);
create index analytics_events_product_id_idx on public.analytics_events (product_id);

create index subscriptions_user_id_status_idx on public.subscriptions (user_id, status);
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);

create index billing_events_user_id_created_at_idx on public.billing_events (user_id, created_at desc);
create index billing_events_subscription_id_created_at_idx on public.billing_events (subscription_id, created_at desc);
create index billing_events_event_type_created_at_idx on public.billing_events (event_type, created_at desc);
create index billing_events_stripe_event_id_idx on public.billing_events (stripe_event_id);

create index ads_placement_active_sort_idx on public.ads (placement, is_active, sort_order);
create index ads_starts_at_ends_at_idx on public.ads (starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_touch_updated_at
before update on public.plans
for each row execute function public.touch_updated_at();

create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

create trigger categories_touch_updated_at
before update on public.categories
for each row execute function public.touch_updated_at();

create trigger shops_touch_updated_at
before update on public.shops
for each row execute function public.touch_updated_at();

create trigger shop_categories_touch_updated_at
before update on public.shop_categories
for each row execute function public.touch_updated_at();

create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create trigger product_tags_touch_updated_at
before update on public.product_tags
for each row execute function public.touch_updated_at();

create trigger favorites_touch_updated_at
before update on public.favorites
for each row execute function public.touch_updated_at();

create trigger follows_touch_updated_at
before update on public.follows
for each row execute function public.touch_updated_at();

create trigger analytics_events_touch_updated_at
before update on public.analytics_events
for each row execute function public.touch_updated_at();

create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

create trigger billing_events_touch_updated_at
before update on public.billing_events
for each row execute function public.touch_updated_at();

create trigger ads_touch_updated_at
before update on public.ads
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Product limit helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.plan_product_limit(target_plan public.plan_key)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select p.product_limit
  from public.plans p
  where p.key = target_plan;
$$;

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  seller_plan public.plan_key;
  allowed_count integer;
  active_count integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select plan_key into seller_plan from public.users where id = new.seller_id;
  allowed_count := public.plan_product_limit(seller_plan);

  if allowed_count is null then
    return new;
  end if;

  select count(*) into active_count
  from public.products
  where seller_id = new.seller_id
    and status = 'active'
    and id <> coalesce(new.id, gen_random_uuid());

  if active_count >= allowed_count then
    raise exception 'product limit exceeded for plan %', seller_plan;
  end if;

  return new;
end;
$$;

create trigger products_enforce_limit
before insert or update of status on public.products
for each row execute function public.enforce_product_limit();

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
    update public.products
    set status = 'active'
    where seller_id = target_seller_id;
    return;
  end if;

  update public.products
  set status = 'hidden'
  where seller_id = target_seller_id;

  with ranked as (
    select id, row_number() over (order by created_at asc, id asc) as rn
    from public.products
    where seller_id = target_seller_id
  )
  update public.products p
  set status = 'active'
  from ranked
  where p.id = ranked.id
    and ranked.rn <= allowed_count;
end;
$$;

create or replace function public.sync_product_visibility_after_plan_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.plan_key is distinct from new.plan_key then
    perform public.sync_product_visibility_for_plan(new.id);
  end if;
  return new;
end;
$$;

create trigger users_sync_products_after_plan_change
after update of plan_key on public.users
for each row execute function public.sync_product_visibility_after_plan_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.shops enable row level security;
alter table public.shop_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.analytics_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.ads enable row level security;

create policy "plans public read" on public.plans
for select using (true);

create policy "users read own or admin" on public.users
for select using (id = auth.uid() or public.is_admin());

create policy "users update own basic fields or admin" on public.users
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "categories public read" on public.categories
for select using (true);

create policy "categories admin write" on public.categories
for all using (public.is_admin())
with check (public.is_admin());

create policy "shops public read published" on public.shops
for select using (is_published or owner_id = auth.uid() or public.is_admin());

create policy "shops owner insert own" on public.shops
for insert with check (owner_id = auth.uid() or public.is_admin());

create policy "shops owner update own" on public.shops
for update using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

create policy "shops owner delete own" on public.shops
for delete using (owner_id = auth.uid() or public.is_admin());

create policy "shop_categories public read published shops" on public.shop_categories
for select using (
  exists (
    select 1 from public.shops s
    where s.id = shop_id and (s.is_published or s.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "shop_categories owner write" on public.shop_categories
for all using (
  exists (
    select 1 from public.shops s
    where s.id = shop_id and (s.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.shops s
    where s.id = shop_id and (s.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "products public read active" on public.products
for select using (
  status = 'active'
  or seller_id = auth.uid()
  or public.is_admin()
);

create policy "products seller insert own" on public.products
for insert with check (
  (seller_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = seller_id
  )
);

create policy "products seller update own" on public.products
for update using (seller_id = auth.uid() or public.is_admin())
with check (
  (seller_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.shops s
    where s.id = shop_id and s.owner_id = seller_id
  )
);

create policy "products seller delete own" on public.products
for delete using (seller_id = auth.uid() or public.is_admin());

create policy "product_tags public read active products" on public.product_tags
for select using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (p.status = 'active' or p.seller_id = auth.uid() or public.is_admin())
  )
);

create policy "product_tags seller write" on public.product_tags
for all using (
  exists (
    select 1 from public.products p
    where p.id = product_id and (p.seller_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_id and (p.seller_id = auth.uid() or public.is_admin())
  )
);

create policy "favorites read own or admin" on public.favorites
for select using (user_id = auth.uid() or public.is_admin());

create policy "favorites insert own" on public.favorites
for insert with check (user_id = auth.uid());

create policy "favorites delete own" on public.favorites
for delete using (user_id = auth.uid() or public.is_admin());

create policy "follows read own or admin" on public.follows
for select using (user_id = auth.uid() or public.is_admin());

create policy "follows insert own" on public.follows
for insert with check (user_id = auth.uid());

create policy "follows delete own" on public.follows
for delete using (user_id = auth.uid() or public.is_admin());

create policy "analytics insert authenticated" on public.analytics_events
for insert with check (auth.uid() is not null or user_id is null);

create policy "analytics admin read" on public.analytics_events
for select using (public.is_admin());

create policy "subscriptions read own or admin" on public.subscriptions
for select using (user_id = auth.uid() or public.is_admin());

create policy "billing_events read own or admin" on public.billing_events
for select using (user_id = auth.uid() or public.is_admin());

create policy "ads public read active" on public.ads
for select using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "ads admin write" on public.ads
for all using (public.is_admin())
with check (public.is_admin());