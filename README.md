# LILSURPRIZ – Little gifts, big surprises.

Mobile-first ecommerce store for customised and ready-made gift hampers (India).

**Stack:** Next.js 14 (App Router, TypeScript, Tailwind) · Supabase (Postgres, Auth, Storage, RLS) · Cashfree Payment Gateway (hosted checkout + webhooks) · Vercel.

## Features
- **Storefront:** home, shop (search/filter/sort), collections (Girls, Boys, Pink Princess, Study Girl, Self Care, Bestie Forever), product pages, cart, checkout, My Account, My Orders, About, Contact and all policy pages.
- **Customise Your Surprise:** pick items + quantities, box colour, occasion, recipient, message, instructions, live price. Pay online or send the enquiry via WhatsApp (saved in Supabase, never marked paid).
- **Admin (`/admin`):** dashboard metrics, products CRUD with multi-image upload (camera/gallery, auto-compressed to WebP, replace/remove/set main), quick price/stock edits, publish/deactivate/archive/delete, categories, orders (status, tracking, cancel + restock, re-check payment), customers, custom enquiries, coupons and website settings (logo, WhatsApp, email, socials, shipping, announcement).
- **Payments:** orders and amounts are computed server-side from the database; Cashfree orders are created server-side; payment is marked paid **only** after server-to-server verification with Cashfree (return URL, webhook with HMAC signature check, or admin re-check). Stock is decremented atomically when payment is confirmed.
- **Security:** Row Level Security on every table, admin role via `admin_users`, service-role and Cashfree secrets are server-only, DB trigger prevents non-service changes to payment/total fields.

## Local development
Requirements: Node 22+, Docker, [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
supabase start                # local Postgres/Auth/Storage
supabase db reset             # applies supabase/migrations + seed.sql
cp .env.example .env.local    # fill with values from `supabase status`
npm run dev
node --env-file=.env.local scripts/create-admin.mjs you@example.com 'StrongPassword'
```
Open http://localhost:3000, sign in with that account and go to http://localhost:3000/admin.

## Production setup
1. **Supabase:** create a project → `supabase link --project-ref <ref>` → `supabase db push` (applies the migration) → run `supabase/seed.sql` in the SQL editor to create the default collections.
   In *Authentication → URL configuration* set the Site URL to your domain.
2. **Admin user:** `node --env-file=.env.production.local scripts/create-admin.mjs owner@lilsurpriz.com 'StrongPassword'`.
3. **Cashfree:** in the merchant dashboard copy the App ID / Secret Key (Test mode for sandbox). Add a webhook pointing to `https://<your-domain>/api/webhooks/cashfree` for *Payment* events (version 2023-08-01). Whitelist your domain for hosted checkout.
4. **Vercel:** import the repo, add the env vars from `.env.example` (set `CASHFREE_ENV=production` and live keys when going live), deploy and attach your domain (HTTPS is automatic).

## Useful paths
| Path | What |
| --- | --- |
| `supabase/migrations/` | schema, RLS, storage buckets, payment functions |
| `src/lib/pricing.ts` | server-side pricing / stock / coupon validation |
| `src/lib/cashfree.ts`, `src/lib/payments.ts` | Cashfree API + payment verification |
| `src/app/api/` | checkout, quote, webhook, enquiries, retry, admin sync |
| `src/app/admin/` | admin dashboard |
