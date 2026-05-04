# Unity Collection — Men's Traditional Wear (Bangladesh)

Premium men's traditional wear, made in Bangladesh. E-commerce storefront + admin
panel built with Vite, React, TypeScript, Tailwind CSS, shadcn/ui and Supabase.

## Local development

Requires Node.js (≥ 18) and npm.

```sh
git clone https://github.com/Zamantest1/unitycollection-bd.git
cd unitycollection-bd
npm install
npm run dev
```

The dev server runs on `http://localhost:8080`.

## Useful scripts

```sh
npm run dev        # Vite dev server
npm run build      # production build
npm run lint       # eslint
npm run test       # vitest run (unit tests)
```

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for data fetching
- Supabase (Postgres + Auth + Storage) with RLS
- Framer Motion for animations
- Vite PWA plugin for the admin app shell

## Deployment

The site auto-deploys to Vercel on every push to `main`. Pull requests get
preview URLs via the Vercel GitHub integration.

## Supabase migrations

SQL migrations live in `supabase/migrations/`. Apply them in order before
testing the customer-facing tracking and order-creation flows. Recent ones:

- `20260503180000_track_order_rpc.sql` — anon-safe tracking RPC.
- `20260503190000_create_order_rpc.sql` — `SECURITY DEFINER` RPC that returns
  the trigger-generated `order_id` so tracking URLs are correct.
