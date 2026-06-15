-- partner_applications: 出店申請

create table public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  shop_name text not null,
  owner_name text not null,
  email text not null,
  region text,
  website_url text,
  instagram_url text,
  x_url text,
  description text,
  mission text,
  target_user text,
  categories text[] not null default '{}',
  status text not null default 'pending',
  review_note text,
  reviewed_at timestamptz,
  constraint partner_applications_status_check check (
    status in ('pending', 'reviewing', 'approved', 'rejected', 'published')
  ),
  constraint partner_applications_email_check check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint partner_applications_website_url_check check (
    website_url is null or website_url ~ '^https?://'
  ),
  constraint partner_applications_instagram_url_check check (
    instagram_url is null or instagram_url ~ '^https?://'
  ),
  constraint partner_applications_x_url_check check (
    x_url is null or x_url ~ '^https?://'
  )
);

create index partner_applications_status_created_at_idx
  on public.partner_applications (status, created_at desc);

create index partner_applications_email_idx
  on public.partner_applications (lower(email));

create trigger partner_applications_touch_updated_at
before update on public.partner_applications
for each row execute function public.touch_updated_at();

alter table public.partner_applications enable row level security;

create policy "partner_applications insert public"
  on public.partner_applications
  for insert
  to anon, authenticated
  with check (true);

create policy "partner_applications select own email"
  on public.partner_applications
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "partner_applications admin select"
  on public.partner_applications
  for select
  to authenticated
  using (public.is_admin());

create policy "partner_applications admin update"
  on public.partner_applications
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());