-- Phase 6 security: RLS hardening

drop policy if exists "shops public read published" on public.shops;
create policy "shops public read published" on public.shops
for select using (
  (is_published and status = 'active')
  or owner_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "products public read active" on public.products;
create policy "products public read active" on public.products
for select using (
  status = 'active'
  or seller_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "products seller delete own" on public.products;
create policy "products seller delete own" on public.products
for delete using (
  (seller_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.shops s
    where s.id = shop_id and (s.owner_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "products seller update own" on public.products;
create policy "products seller update own" on public.products
for update using (
  (seller_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.shops s
    where s.id = shop_id and (s.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  (seller_id = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.shops s
    where s.id = shop_id and (s.owner_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "partner_applications select own email" on public.partner_applications;
create policy "partner_applications select own email" on public.partner_applications
for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "partner_applications admin select" on public.partner_applications;
create policy "partner_applications admin select" on public.partner_applications
for select to authenticated
using (public.is_admin());

drop policy if exists "partner_applications admin update" on public.partner_applications;
create policy "partner_applications admin update" on public.partner_applications
for update to authenticated
using (public.is_admin())
with check (public.is_admin());