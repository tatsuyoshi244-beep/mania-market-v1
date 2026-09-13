-- Mania Market: add digital product and service categories.
-- Safe to run repeatedly after 001_initial_schema.sql.

insert into public.categories (slug, name, description, sort_order) values
  ('web', 'Web・アプリ', 'Webサイト、アプリ、SaaSなどオンラインで提供される専門サービス', 70),
  ('ai', 'AI・生成AI', 'AIツール、生成AI作品、プロンプト、業務支援サービス', 80)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;
