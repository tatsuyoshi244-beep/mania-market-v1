-- Mania Market: additive platform completion migration for Neon.
-- Safe to run after 001_initial_schema.sql.

alter table public.shops
  add column if not exists location text,
  add column if not exists status text not null default 'active',
  add column if not exists partner_application_id uuid,
  add column if not exists pending_owner_email text,
  add column if not exists plan_key public.plan_key not null default 'free';

alter table public.products add column if not exists category_id uuid references public.categories(id) on delete set null;

alter table public.partner_applications
  alter column applicant_name drop not null,
  alter column category drop not null,
  alter column description drop not null,
  alter column specialty drop not null;

alter table public.partner_applications
  add column if not exists owner_name text,
  add column if not exists region text,
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists x_url text,
  add column if not exists mission text,
  add column if not exists target_user text,
  add column if not exists categories text[] not null default '{}',
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists shop_id uuid references public.shops(id) on delete set null,
  add column if not exists pending_owner_email text,
  add column if not exists ai_specialty integer,
  add column if not exists ai_originality integer,
  add column if not exists ai_passion integer,
  add column if not exists ai_safety integer,
  add column if not exists ai_recommendation text,
  add column if not exists ai_comment text,
  add column if not exists ai_checked_at timestamptz;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  key public.plan_key not null unique,
  name text not null,
  monthly_price integer not null default 0,
  product_limit integer,
  stripe_price_id text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create type public.subscription_status as enum ('active','trialing','past_due','canceled','incomplete','incomplete_expired','unpaid','paused');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'incomplete',
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  event_type text not null,
  stripe_event_id text unique,
  amount integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  subject_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists favorites_user_product_unique on public.favorites(user_id, product_id) where product_id is not null;
create unique index if not exists favorites_user_shop_unique on public.favorites(user_id, shop_id) where shop_id is not null;
create index if not exists products_category_idx on public.products(category_id);
create index if not exists partner_applications_email_idx on public.partner_applications(lower(email));
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists rate_limit_lookup_idx on public.rate_limit_events(bucket, subject_hash, created_at desc);

insert into public.plans (key, name, monthly_price, product_limit, sort_order) values
  ('free', '無料', 0, 3, 1),
  ('standard', 'スタンダード', 980, 30, 2),
  ('premium', 'プレミアム', 4980, null, 3)
on conflict (key) do update set name = excluded.name, monthly_price = excluded.monthly_price,
  product_limit = excluded.product_limit, sort_order = excluded.sort_order, updated_at = now();
