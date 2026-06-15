@echo off
set NEXT_PUBLIC_SITE_URL=http://localhost:3000
set NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
set NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy
set SUPABASE_SERVICE_ROLE_KEY=dummy
set STRIPE_SECRET_KEY=sk_test_dummy
set STRIPE_WEBHOOK_SECRET=whsec_dummy
set STRIPE_STANDARD_PRICE_ID=price_standard
set STRIPE_PREMIUM_PRICE_ID=price_premium
npm.cmd run dev -- --port 3000 > work\dev-server.log 2>&1
