-- Phase 4.5: Mania Review AI（一次審査）

alter table public.partner_applications
  add column if not exists ai_score integer,
  add column if not exists ai_specialty integer,
  add column if not exists ai_originality integer,
  add column if not exists ai_passion integer,
  add column if not exists ai_safety integer,
  add column if not exists ai_recommendation text,
  add column if not exists ai_comment text,
  add column if not exists ai_checked_at timestamptz;

alter table public.partner_applications drop constraint if exists partner_applications_ai_score_check;
alter table public.partner_applications add constraint partner_applications_ai_score_check
  check (ai_score is null or (ai_score >= 0 and ai_score <= 100));

alter table public.partner_applications drop constraint if exists partner_applications_ai_specialty_check;
alter table public.partner_applications add constraint partner_applications_ai_specialty_check
  check (ai_specialty is null or (ai_specialty >= 0 and ai_specialty <= 25));

alter table public.partner_applications drop constraint if exists partner_applications_ai_originality_check;
alter table public.partner_applications add constraint partner_applications_ai_originality_check
  check (ai_originality is null or (ai_originality >= 0 and ai_originality <= 25));

alter table public.partner_applications drop constraint if exists partner_applications_ai_passion_check;
alter table public.partner_applications add constraint partner_applications_ai_passion_check
  check (ai_passion is null or (ai_passion >= 0 and ai_passion <= 25));

alter table public.partner_applications drop constraint if exists partner_applications_ai_safety_check;
alter table public.partner_applications add constraint partner_applications_ai_safety_check
  check (ai_safety is null or (ai_safety >= 0 and ai_safety <= 25));

create index if not exists partner_applications_ai_score_idx
  on public.partner_applications (ai_score desc nulls last);