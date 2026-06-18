-- Phase 7: Stripe billing hardening + premium price correction

update public.plans
set monthly_price = 2980, name = 'プレミアム'
where key = 'premium';

create unique index if not exists billing_events_stripe_event_id_unique
  on public.billing_events (stripe_event_id)
  where stripe_event_id is not null;

create or replace function public.prevent_self_service_plan_key_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.plan_key is distinct from new.plan_key then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'plan_key can only be changed by billing system';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists users_prevent_self_service_plan_key_change on public.users;
create trigger users_prevent_self_service_plan_key_change
before update of plan_key on public.users
for each row
execute function public.prevent_self_service_plan_key_change();