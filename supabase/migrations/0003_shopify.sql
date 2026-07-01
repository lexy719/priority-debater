-- ============================================================================
-- PD Commerce — Shopify OAuth + ad connections + server-side tracking
-- ----------------------------------------------------------------------------
-- Run once (Supabase SQL editor or `supabase db push`). 0002 is the newsletter
-- migration, so this is 0003. Tokens are stored per-user behind RLS; encrypt
-- access_token at rest before production (e.g. pgsodium / app-side envelope).
-- ============================================================================

-- ── Shopify store connection (one per user+shop) ───────────────────────────
create table if not exists public.shopify_connections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  shop_domain    text not null,
  access_token   text not null,
  shop_name      text,
  shop_currency  text,
  shop_country   text,
  connected_at   timestamptz not null default now(),
  last_synced_at timestamptz,
  unique (user_id, shop_domain)
);

-- ── Per-product cache (scores + optimised copy + video) ─────────────────────
create table if not exists public.shopify_products_cache (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users (id) on delete cascade,
  shop_domain           text not null,
  shopify_product_id    text not null,
  title                 text,
  original_description  text,
  optimised_description text,
  ai_score              integer,
  has_video             boolean default false,
  video_url             text,
  agent_ready           boolean default false,
  last_updated          timestamptz not null default now(),
  unique (user_id, shopify_product_id)
);

-- ── Ad platform connections (Meta / Google) ────────────────────────────────
create table if not exists public.ad_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  platform      text not null check (platform in ('meta','google')),
  account_id    text,
  pixel_id      text,
  access_token  text,
  refresh_token text,
  connected_at  timestamptz not null default now(),
  unique (user_id, platform)
);

-- ── Server-side tracking events (Shopify order webhook → here) ──────────────
create table if not exists public.tracking_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete cascade,
  shop_domain text,
  order_id    text,
  event_type  text not null default 'purchase',
  value       numeric,
  currency    text,
  channel     text,                    -- meta | google | organic | ai | direct | other
  click_id    text,                    -- captured fbclid / gclid for attribution
  raw         jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists tracking_events_user_idx on public.tracking_events (user_id, created_at desc);

-- ── Row Level Security: a user only ever sees / writes their own rows ───────
alter table public.shopify_connections     enable row level security;
alter table public.shopify_products_cache  enable row level security;
alter table public.ad_connections          enable row level security;
alter table public.tracking_events         enable row level security;

drop policy if exists "shopify_connections_own" on public.shopify_connections;
create policy "shopify_connections_own" on public.shopify_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "shopify_products_own" on public.shopify_products_cache;
create policy "shopify_products_own" on public.shopify_products_cache
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ad_connections_own" on public.ad_connections;
create policy "ad_connections_own" on public.ad_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tracking_events_own" on public.tracking_events;
create policy "tracking_events_own" on public.tracking_events
  for select using (auth.uid() = user_id);
-- Inserts to tracking_events come from the Shopify webhook (service role), not
-- end users, so there is intentionally no user INSERT policy here.
