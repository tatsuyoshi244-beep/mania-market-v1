-- Mania Market: partner acquisition CRM and attribution.
-- Run after 002_complete_platform.sql. Safe to run repeatedly.

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  invite_token uuid not null default gen_random_uuid() unique,
  shop_name text not null,
  contact_name text,
  email text,
  category text,
  region text,
  website_url text,
  instagram_url text,
  x_url text,
  source text not null default 'manual',
  status text not null default 'candidate'
    check (status in ('candidate','ready','contacted','replied','explaining','applied','published','paused','declined')),
  priority integer not null default 2 check (priority between 1 and 3),
  notes text,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  application_id uuid references public.partner_applications(id) on delete set null,
  published_shop_id uuid references public.shops(id) on delete set null,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.partner_leads(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('note','email','instagram','x','phone','meeting','status_change')),
  note text not null,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.partner_applications
  add column if not exists acquisition_source text,
  add column if not exists acquisition_campaign text,
  add column if not exists referral_code text,
  add column if not exists partner_lead_id uuid references public.partner_leads(id) on delete set null;

create index if not exists partner_leads_status_next_action_idx
  on public.partner_leads(status, next_action_at nulls last, updated_at desc);
create index if not exists partner_leads_email_idx on public.partner_leads(lower(email));
create index if not exists partner_lead_activities_lead_created_idx
  on public.partner_lead_activities(lead_id, created_at desc);
create index if not exists partner_applications_source_idx
  on public.partner_applications(acquisition_source, created_at desc);
create index if not exists partner_applications_lead_idx
  on public.partner_applications(partner_lead_id);

