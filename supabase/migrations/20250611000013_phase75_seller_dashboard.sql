-- Phase 7.5: seller dashboard stats + shop location

alter table public.shops
  add column if not exists location text;

create or replace function public.is_shop_owner(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shops
    where id = target_shop_id and owner_id = auth.uid()
  );
$$;

create or replace function public.seller_can_view_shop(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_shop_owner(target_shop_id) or public.is_admin();
$$;

create or replace function public.seller_shop_stats(target_shop_id uuid)
returns table (
  follower_count bigint,
  shop_favorite_count bigint,
  product_favorite_count bigint,
  shop_view_count bigint,
  product_view_count bigint,
  total_view_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.seller_can_view_shop(target_shop_id) then
    raise exception 'access denied';
  end if;

  return query
  select
    (select count(*)::bigint from public.follows where shop_id = target_shop_id),
    (select count(*)::bigint from public.favorites where shop_id = target_shop_id),
    (
      select count(*)::bigint
      from public.favorites f
      join public.products p on p.id = f.product_id
      where p.shop_id = target_shop_id and f.product_id is not null
    ),
    (
      select count(*)::bigint
      from public.analytics_events
      where shop_id = target_shop_id and event_type = 'shop_view'
    ),
    (
      select count(*)::bigint
      from public.analytics_events
      where shop_id = target_shop_id and event_type = 'product_view'
    ),
    (
      select count(*)::bigint
      from public.analytics_events
      where shop_id = target_shop_id and event_type in ('shop_view', 'product_view')
    );
end;
$$;

create or replace function public.seller_shop_analytics(target_shop_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.seller_can_view_shop(target_shop_id) then
    raise exception 'access denied';
  end if;

  select jsonb_build_object(
    'views_today', (
      select count(*)::int
      from public.analytics_events
      where shop_id = target_shop_id
        and event_type in ('shop_view', 'product_view')
        and created_at >= date_trunc('day', now())
    ),
    'views_7d', (
      select count(*)::int
      from public.analytics_events
      where shop_id = target_shop_id
        and event_type in ('shop_view', 'product_view')
        and created_at >= now() - interval '7 days'
    ),
    'views_30d', (
      select count(*)::int
      from public.analytics_events
      where shop_id = target_shop_id
        and event_type in ('shop_view', 'product_view')
        and created_at >= now() - interval '30 days'
    ),
    'top_products', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select p.id as product_id, p.name, count(*)::int as views
        from public.analytics_events ae
        join public.products p on p.id = ae.product_id
        where ae.shop_id = target_shop_id
          and ae.event_type = 'product_view'
          and ae.created_at >= now() - interval '30 days'
        group by p.id, p.name
        order by views desc, p.name asc
        limit 5
      ) t
    ), '[]'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select page_type, label, views
        from (
          select 'shop'::text as page_type,
            'ショップページ'::text as label,
            count(*)::int as views
          from public.analytics_events
          where shop_id = target_shop_id
            and event_type = 'shop_view'
            and created_at >= now() - interval '30 days'
          union all
          select 'product'::text,
            coalesce(p.name, '商品ページ')::text,
            count(*)::int
          from public.analytics_events ae
          left join public.products p on p.id = ae.product_id
          where ae.shop_id = target_shop_id
            and ae.event_type = 'product_view'
            and ae.created_at >= now() - interval '30 days'
          group by p.name
        ) pages
        order by views desc, label asc
        limit 5
      ) t
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.is_shop_owner(uuid) from public;
revoke all on function public.seller_can_view_shop(uuid) from public;
revoke all on function public.seller_shop_stats(uuid) from public;
revoke all on function public.seller_shop_analytics(uuid) from public;

grant execute on function public.is_shop_owner(uuid) to authenticated;
grant execute on function public.seller_can_view_shop(uuid) to authenticated;
grant execute on function public.seller_shop_stats(uuid) to authenticated;
grant execute on function public.seller_shop_analytics(uuid) to authenticated;