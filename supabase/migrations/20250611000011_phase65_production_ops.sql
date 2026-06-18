-- Phase 6.5: audit logs + rate limit

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_created_at_idx on public.audit_logs (action, created_at desc);
create index if not exists audit_logs_user_id_created_at_idx on public.audit_logs (user_id, created_at desc);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_bucket_created_idx
  on public.rate_limit_events (bucket_key, created_at desc);

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_max_count integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_events
  where bucket_key = p_bucket_key
    and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*)::integer into v_count
  from public.rate_limit_events
  where bucket_key = p_bucket_key;

  if v_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_events (bucket_key) values (p_bucket_key);
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

alter table public.audit_logs enable row level security;
alter table public.rate_limit_events enable row level security;

drop policy if exists "audit_logs admin select" on public.audit_logs;
create policy "audit_logs admin select" on public.audit_logs
for select to authenticated
using (public.is_admin());

drop policy if exists "rate_limit_events deny all" on public.rate_limit_events;
create policy "rate_limit_events deny all" on public.rate_limit_events
for all to authenticated
using (false)
with check (false);