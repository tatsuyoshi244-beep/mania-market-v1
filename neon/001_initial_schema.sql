create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('buyer', 'seller', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_key as enum ('free', 'standard', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('active', 'hidden');
exception when duplicate_object then null; end $$;

create table if not exists public.users (
  id text primary key,
  email text unique,
  role public.user_role not null default 'buyer',
  display_name text,
  avatar_url text,
  plan_key public.plan_key not null default 'free',
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id text references public.users(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  logo_url text,
  cover_image_url text,
  website_url text,
  twitter_url text,
  instagram_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_categories (
  shop_id uuid not null references public.shops(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (shop_id, category_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  seller_id text references public.users(id) on delete set null,
  name text not null,
  description text,
  price_label text,
  external_url text not null,
  image_url text,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
  primary key (product_id, tag)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((product_id is not null)::int + (shop_id is not null)::int = 1)
);

create table if not exists public.follows (
  user_id text not null references public.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, shop_id)
);

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete set null,
  applicant_name text not null,
  email text not null,
  shop_name text not null,
  shop_url text,
  category text not null,
  description text not null,
  specialty text not null,
  external_sales_url text,
  status text not null default 'pending' check (status in ('pending','reviewing','approved','rejected','published')),
  ai_score integer,
  ai_decision text,
  ai_reason text,
  admin_note text,
  published_shop_id uuid references public.shops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete set null,
  event_type text not null,
  shop_id uuid references public.shops(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shops_published_created_idx on public.shops(is_published, created_at desc);
create index if not exists products_status_created_idx on public.products(status, created_at desc);
create index if not exists partner_applications_status_idx on public.partner_applications(status, created_at desc);

insert into public.categories (slug, name, description, sort_order) values
  ('vintage', 'ヴィンテージ', '時代を越えて愛される一点物と専門店', 10),
  ('craft', 'クラフト・工芸', '作り手の技術と物語が宿る品々', 20),
  ('outdoor', 'アウトドア', '深い知識で選ばれたフィールドギア', 30),
  ('music', '音楽・オーディオ', '音を追求する人のための機材と作品', 40),
  ('collectibles', 'コレクション', '希少性と背景を楽しむ収集の世界', 50),
  ('food', '食・嗜好品', '専門家が届けるこだわりの味', 60)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
