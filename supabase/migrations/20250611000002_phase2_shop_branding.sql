-- Phase 2: shop branding and SNS links
alter table public.shops
  add column if not exists logo_url text,
  add column if not exists cover_image_url text,
  add column if not exists twitter_url text,
  add column if not exists instagram_url text;

alter table public.shops drop constraint if exists shops_logo_url_check;
alter table public.shops add constraint shops_logo_url_check
  check (logo_url is null or logo_url ~ '^https?://');

alter table public.shops drop constraint if exists shops_cover_image_url_check;
alter table public.shops add constraint shops_cover_image_url_check
  check (cover_image_url is null or cover_image_url ~ '^https?://');

alter table public.shops drop constraint if exists shops_twitter_url_check;
alter table public.shops add constraint shops_twitter_url_check
  check (twitter_url is null or twitter_url ~ '^https?://');

alter table public.shops drop constraint if exists shops_instagram_url_check;
alter table public.shops add constraint shops_instagram_url_check
  check (instagram_url is null or instagram_url ~ '^https?://');