-- ============================================================================
-- PDR — consolidated schema for the NEW Supabase project (ewrqmzvfogsgvkcidata)
-- Generated 2026-07-24. Paste this whole file into: Dashboard → SQL Editor → Run.
-- Order: auth+credits → newsletter → shopify → commerce → pd_commerce.
-- Safe to re-run (create if not exists / drop-and-recreate policies).
-- NOTE: 0001_init.sql was superseded by 0001_init_auth_credits.sql (the code
-- calls grant_credits/spend_credits) and is archived in supabase/_archive/.
-- ============================================================================

-- ─────────────────────────────── migrations/0001_init_auth_credits.sql ───────────────────────────────
-- ============================================================================
-- Priority Debater — auth + credits schema
-- ----------------------------------------------------------------------------
-- Run this once against your Supabase project. Two ways:
--   • Supabase dashboard → SQL Editor → paste this whole file → Run.
--   • CLI: `supabase db push` (with this file under supabase/migrations/).
--
-- It creates everything the app code already expects:
--   • profiles.credits           (read by getBalanceForUser / /api/credits)
--   • spend_credits()  RPC        (guardAndSpend)
--   • refund_credits() RPC        (refund on a failed paid run)
--   • grant_credits()  RPC        (Stripe top-up webhook, service role)
--   • a signup trigger granting SIGNUP_GRANT = 50 credits to new accounts
--   • Row Level Security so users only ever see their own row/ledger
-- Credits are NEVER mutated directly by clients — only via the SECURITY DEFINER
-- RPCs below, which is why there is no user UPDATE policy on profiles.credits.
-- ============================================================================

-- ── profiles: one row per auth user ────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text,
  credits            integer not null default 50 check (credits >= 0),
  plan               text not null default 'free',
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── credit_ledger: append-only audit of every grant / spend / refund ────────
create table if not exists public.credit_ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  delta         integer not null,            -- negative = spend, positive = grant/refund
  reason        text not null,               -- matches CreditAction keys, 'signup_grant', 'refund_*', 'pack_*'
  balance_after integer not null,
  created_at    timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

-- ── new-account trigger: create the profile + grant 50 credits ──────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 50)
  on conflict (id) do nothing;

  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (new.id, 50, 'signup_grant', 50);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── spend_credits: atomic charge for the calling user ───────────────────────
-- Returns { ok: boolean, balance: integer }. ok=false when underfunded/no row.
create or replace function public.spend_credits(p_amount integer, p_reason text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_balance integer;
begin
  if v_uid is null then
    return json_build_object('ok', false, 'balance', 0);
  end if;
  if p_amount is null or p_amount <= 0 then
    select credits into v_balance from public.profiles where id = v_uid;
    return json_build_object('ok', true, 'balance', coalesce(v_balance, 0));
  end if;

  -- lock the row so concurrent spends can't double-spend
  select credits into v_balance from public.profiles where id = v_uid for update;
  if v_balance is null then
    return json_build_object('ok', false, 'balance', 0);
  end if;
  if v_balance < p_amount then
    return json_build_object('ok', false, 'balance', v_balance);
  end if;

  v_balance := v_balance - p_amount;
  update public.profiles set credits = v_balance, updated_at = now() where id = v_uid;
  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (v_uid, -p_amount, p_reason, v_balance);

  return json_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- ── refund_credits: give credits back to the calling user (failed run) ──────
create or replace function public.refund_credits(p_amount integer, p_reason text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_balance integer;
begin
  if v_uid is null or p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'balance', 0);
  end if;

  select credits into v_balance from public.profiles where id = v_uid for update;
  if v_balance is null then
    return json_build_object('ok', false, 'balance', 0);
  end if;

  v_balance := v_balance + p_amount;
  update public.profiles set credits = v_balance, updated_at = now() where id = v_uid;
  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (v_uid, p_amount, p_reason, v_balance);

  return json_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- ── grant_credits: privileged top-up by user id (Stripe webhook / service) ──
-- Called with the service-role key (bypasses RLS). Targets an explicit user.
create or replace function public.grant_credits(p_user uuid, p_amount integer, p_reason text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_user is null or p_amount is null or p_amount <= 0 then
    return json_build_object('ok', false, 'balance', 0);
  end if;

  select credits into v_balance from public.profiles where id = p_user for update;
  if v_balance is null then
    return json_build_object('ok', false, 'balance', 0);
  end if;

  v_balance := v_balance + p_amount;
  update public.profiles set credits = v_balance, updated_at = now() where id = p_user;
  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (p_user, p_amount, p_reason, v_balance);

  return json_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.credit_ledger enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- NO user UPDATE/INSERT/DELETE policy on profiles by design: credits would be
-- forgeable otherwise (update profiles set credits=9999). All writes happen via
-- the SECURITY DEFINER RPCs, the signup trigger, or the service role. Belt-and-
-- suspenders: explicitly strip table writes from normal clients.
revoke insert, update, delete on public.profiles from anon, authenticated;

drop policy if exists "ledger_select_own" on public.credit_ledger;
create policy "ledger_select_own" on public.credit_ledger
  for select using (auth.uid() = user_id);

-- ── Execute grants ──────────────────────────────────────────────────────────
revoke all on function public.spend_credits(integer, text)  from public, anon;
revoke all on function public.refund_credits(integer, text) from public, anon;
revoke all on function public.grant_credits(uuid, integer, text) from public, anon, authenticated;

grant execute on function public.spend_credits(integer, text)  to authenticated;
grant execute on function public.refund_credits(integer, text) to authenticated;
grant execute on function public.grant_credits(uuid, integer, text) to service_role;

-- ── Backfill: profiles for any users created before this migration ──────────
insert into public.profiles (id, email, credits)
select u.id, u.email, 50
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ─────────────────────────────── migrations/0002_newsletter.sql ───────────────────────────────
-- ============================================================================
-- Priority Debater — newsletter subscribers
-- ----------------------------------------------------------------------------
-- Backs POST /api/newsletter (the modal + footer signup). Insert-only for
-- normal clients; reads stay server/service-role only.
-- Run via Supabase dashboard SQL editor or `supabase db push`.
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id          bigint generated always as identity primary key,
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Allow anonymous & signed-in clients to subscribe (insert), nothing else.
drop policy if exists "newsletter_insert" on public.newsletter_subscribers;
create policy "newsletter_insert" on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (true);

-- No select/update/delete for normal clients — the list is private.
revoke select, update, delete on public.newsletter_subscribers from anon, authenticated;

-- ─────────────────────────────── migrations/0003_shopify.sql ───────────────────────────────
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

-- ─────────────────────────────── migrations/0004_commerce.sql ───────────────────────────────
-- ============================================================================
-- PD Commerce — intelligence reports, weekly snapshots, agent threads
-- ----------------------------------------------------------------------------
-- Run after 0003_shopify.sql (Supabase SQL editor or `supabase db push`).
-- 0003 already defines public.shopify_connections (FK -> auth.users) — we REUSE
-- it, this migration does not redefine it. Reports are stored server-side so a
-- ?r=<share_id> link renders for anyone (sharing is a marketing channel), while
-- owners keep a permanent unlocked copy behind RLS.
-- ============================================================================

-- ── The shock report (one row per scanned URL, per user) ────────────────────
create table if not exists public.commerce_reports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users (id) on delete cascade,  -- null = anon free preview
  share_id       text not null unique,
  url            text not null,
  store_name     text,
  category       text,
  scores         jsonb not null,
  buyer_queries  jsonb not null,
  competitors    jsonb not null,
  google_signals jsonb,
  fixes          jsonb not null,
  unlocked       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists commerce_reports_user_idx on public.commerce_reports (user_id, created_at desc);
create index if not exists commerce_reports_url_idx  on public.commerce_reports (url);

-- ── Weekly snapshots — feeds the "what changed this week" pulse ──────────────
create table if not exists public.commerce_snapshots (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references public.commerce_reports (id) on delete cascade,
  scores        jsonb not null,
  buyer_queries jsonb not null,
  competitors   jsonb not null,
  captured_at   timestamptz not null default now()
);
create index if not exists commerce_snapshots_report_idx on public.commerce_snapshots (report_id, captured_at desc);

-- ── PD Agent conversations ──────────────────────────────────────────────────
create table if not exists public.commerce_agent_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  report_id  uuid references public.commerce_reports (id) on delete set null,
  title      text,
  messages   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists commerce_agent_threads_user_idx on public.commerce_agent_threads (user_id, updated_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.commerce_reports        enable row level security;
alter table public.commerce_snapshots      enable row level security;
alter table public.commerce_agent_threads  enable row level security;

-- Reports: owners can do anything with their own rows...
drop policy if exists "commerce_reports_own" on public.commerce_reports;
create policy "commerce_reports_own" on public.commerce_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ...and ANYONE can read any report (shared ?r=<share_id> links + anon previews).
-- Writes still require ownership via the policy above; this is read-only.
drop policy if exists "commerce_reports_public_read" on public.commerce_reports;
create policy "commerce_reports_public_read" on public.commerce_reports
  for select using (true);

-- Snapshots: only visible to the owner of the parent report.
drop policy if exists "commerce_snapshots_own" on public.commerce_snapshots;
create policy "commerce_snapshots_own" on public.commerce_snapshots
  for all using (
    exists (
      select 1 from public.commerce_reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

-- Threads: owner-only.
drop policy if exists "commerce_agent_threads_own" on public.commerce_agent_threads;
create policy "commerce_agent_threads_own" on public.commerce_agent_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────── migrations/0005_pd_commerce.sql ───────────────────────────────
-- ============================================================================
-- PD Commerce rebuild — Phase 2 data model (design doc §7 "Data Model")
-- ----------------------------------------------------------------------------
-- Run after 0004_commerce.sql (Supabase SQL editor or `supabase db push`).
-- ADDITIVE: this migration introduces the 11 core commerce entities and does not
-- redefine anything from 0001–0004. Tables map 1:1 onto src/lib/commerce/data/
-- types.ts, which the localStorage store (store.ts) mirrors today so it can be
-- swapped for these tables once SERVICE_ROLE_KEY is wired.
--
-- BILLING IS DERIVED, NOT STORED (§1.5 operating-rule): there is intentionally NO
-- billing_records TABLE with a stored total. `billing_records` is a VIEW computed
-- from attribution_events, so the total can never drift from the events that back
-- it. Layers 1 & 2 are billable; layer 3 is excluded. See the view at the bottom.
-- ============================================================================

-- ── 1. stores ───────────────────────────────────────────────────────────────
create table if not exists public.pd_stores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,  -- null = anon/local
  name       text not null,
  url        text not null,
  platform   text not null default 'generic'
             check (platform in ('shopify','woo','bigcommerce','generic')),
  plan       text not null default 'starter'
             check (plan in ('starter','growth','scale')),
  created_at timestamptz not null default now()
);
create index if not exists pd_stores_user_idx on public.pd_stores (user_id, created_at desc);

-- ── 2. products ──────────────────────────────────────────────────────────────
create table if not exists public.pd_products (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.pd_stores (id) on delete cascade,
  title         text not null,
  url           text not null,
  external_id   text,
  current_score text not null default 'at_risk'
                check (current_score in ('invisible','at_risk','winning')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists pd_products_store_idx on public.pd_products (store_id);

-- ── 3. scans ─────────────────────────────────────────────────────────────────
create table if not exists public.pd_scans (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.pd_stores (id) on delete cascade,
  status       text not null default 'queued'
               check (status in ('queued','running','complete','failed')),
  result       jsonb,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists pd_scans_store_idx on public.pd_scans (store_id, started_at desc);

-- ── 4. fixes ─────────────────────────────────────────────────────────────────
create table if not exists public.pd_fixes (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.pd_stores (id) on delete cascade,
  product_id  uuid references public.pd_products (id) on delete set null,
  type        text not null,
  title       text not null,
  description text not null default '',
  status      text not null default 'draft'
              check (status in ('draft','pushed','rejected')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists pd_fixes_store_idx on public.pd_fixes (store_id, created_at desc);

-- ── 5. attribution_events (the billing ledger) ───────────────────────────────
-- layer 1 & 2 are BILLABLE; layer 3 is excluded from billing (§1.5).
-- order_id is the REAL order backing the event, so every billed euro is traceable.
create table if not exists public.pd_attribution_events (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.pd_stores (id) on delete cascade,
  product_id          uuid references public.pd_products (id) on delete set null,
  fix_id              uuid references public.pd_fixes (id) on delete set null,
  order_id            text not null,
  layer               smallint not null check (layer in (1,2,3)),
  incremental_revenue numeric(12,2) not null default 0,  -- euros
  source              text,
  occurred_at         timestamptz not null default now(),
  period              text not null                       -- 'YYYY-MM'
);
create index if not exists pd_attr_store_period_idx
  on public.pd_attribution_events (store_id, period);
create index if not exists pd_attr_order_idx
  on public.pd_attribution_events (order_id);

-- ── 6. return_risk_events ────────────────────────────────────────────────────
create table if not exists public.pd_return_risk_events (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.pd_stores (id) on delete cascade,
  product_id  uuid references public.pd_products (id) on delete set null,
  order_id    text not null,
  risk        text not null check (risk in ('low','medium','high')),
  probability numeric(4,3) not null default 0,  -- 0..1
  reason      text,
  occurred_at timestamptz not null default now()
);
create index if not exists pd_return_risk_store_idx on public.pd_return_risk_events (store_id);

-- ── 7. module_unlocks ────────────────────────────────────────────────────────
create table if not exists public.pd_module_unlocks (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.pd_stores (id) on delete cascade,
  module      text not null
              check (module in ('visibility','fixes','attribution','content','return_risk','autonomy')),
  unlocked    boolean not null default false,
  unlocked_at timestamptz,
  unique (store_id, module)
);

-- ── 8. content_items ─────────────────────────────────────────────────────────
create table if not exists public.pd_content_items (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.pd_stores (id) on delete cascade,
  product_id    uuid references public.pd_products (id) on delete set null,
  type          text not null check (type in ('text','image','video')),
  title         text not null,
  body          text not null default '',
  status        text not null default 'draft'
                check (status in ('draft','scheduled','published')),
  scheduled_for timestamptz,
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists pd_content_store_idx on public.pd_content_items (store_id, created_at desc);

-- ── 9. customers ─────────────────────────────────────────────────────────────
create table if not exists public.pd_customers (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.pd_stores (id) on delete cascade,
  external_id text,
  email       text,
  name        text,
  ltv         numeric(12,2) not null default 0,  -- euros
  created_at  timestamptz not null default now()
);
create index if not exists pd_customers_store_idx on public.pd_customers (store_id);

-- ── 10. autonomy_settings ────────────────────────────────────────────────────
-- auto_approve DEFAULTS TO FALSE — nothing ships autonomously until opt-in (§7).
create table if not exists public.pd_autonomy_settings (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.pd_stores (id) on delete cascade,
  auto_approve boolean not null default false,
  max_spend    numeric(12,2),  -- euros per action-run; null = no cap
  updated_at   timestamptz not null default now(),
  unique (store_id)
);

-- ── 11. billing_records — DERIVED VIEW, NOT A TABLE (§1.5) ────────────────────
-- We deliberately do NOT store an independently-computed total. Storing a total
-- risks it drifting from the attribution_events that justify it. Instead this VIEW
-- recomputes base_fee + performance_fee + capped_at + total from
-- pd_attribution_events every time it is read, so the number is always auditable
-- back to its backing events (mirror of computeBillingRecord in store.ts).
--
-- Fee model (§1.2): base_fee is the plan subscription; performance_fee is 8% of
-- AI-attributed incremental revenue from BILLABLE events (layers 1 & 2 only —
-- layer 3 excluded per §1.5); the Growth plan's performance fee is capped at
-- €300/mo. total = base_fee + performance_fee.
create or replace view public.pd_billing_records as
with billable as (
  select
    e.store_id,
    e.period,
    sum(e.incremental_revenue) as billable_revenue,
    count(*)                   as event_count
  from public.pd_attribution_events e
  where e.layer in (1, 2)   -- layer 3 is NOT billable (§1.5)
  group by e.store_id, e.period
)
select
  s.id      as store_id,
  b.period,
  s.plan,
  -- base_fee: plan subscription
  (case s.plan when 'starter' then 49 when 'growth' then 99 when 'scale' then 299 else 0 end)::numeric(12,2)
            as base_fee,
  -- capped_at: only Growth caps the performance fee (§1.2)
  (case s.plan when 'growth' then 300 else null end)::numeric(12,2)
            as capped_at,
  -- performance_fee: 8% of billable revenue, capped for Growth
  (case
     when s.plan = 'growth' then least(round(b.billable_revenue * 0.08, 2), 300)
     else round(b.billable_revenue * 0.08, 2)
   end)::numeric(12,2) as performance_fee,
  round(b.billable_revenue, 2) as billable_revenue,
  b.event_count,
  -- total is DERIVED here, never stored
  ((case s.plan when 'starter' then 49 when 'growth' then 99 when 'scale' then 299 else 0 end)
   + (case
        when s.plan = 'growth' then least(round(b.billable_revenue * 0.08, 2), 300)
        else round(b.billable_revenue * 0.08, 2)
      end))::numeric(12,2) as total
from billable b
join public.pd_stores s on s.id = b.store_id;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.pd_stores              enable row level security;
alter table public.pd_products            enable row level security;
alter table public.pd_scans               enable row level security;
alter table public.pd_fixes               enable row level security;
alter table public.pd_attribution_events  enable row level security;
alter table public.pd_return_risk_events  enable row level security;
alter table public.pd_module_unlocks      enable row level security;
alter table public.pd_content_items       enable row level security;
alter table public.pd_customers           enable row level security;
alter table public.pd_autonomy_settings   enable row level security;

-- Stores: owner-only.
drop policy if exists "pd_stores_own" on public.pd_stores;
create policy "pd_stores_own" on public.pd_stores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Child tables: visible/writable only to the owner of the parent store.
-- (Helper predicate repeated per table since PostgREST RLS can't share a function
--  cheaply here; each checks pd_stores ownership.)
drop policy if exists "pd_products_own" on public.pd_products;
create policy "pd_products_own" on public.pd_products for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_scans_own" on public.pd_scans;
create policy "pd_scans_own" on public.pd_scans for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_fixes_own" on public.pd_fixes;
create policy "pd_fixes_own" on public.pd_fixes for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_attr_own" on public.pd_attribution_events;
create policy "pd_attr_own" on public.pd_attribution_events for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_return_risk_own" on public.pd_return_risk_events;
create policy "pd_return_risk_own" on public.pd_return_risk_events for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_module_unlocks_own" on public.pd_module_unlocks;
create policy "pd_module_unlocks_own" on public.pd_module_unlocks for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_content_own" on public.pd_content_items;
create policy "pd_content_own" on public.pd_content_items for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_customers_own" on public.pd_customers;
create policy "pd_customers_own" on public.pd_customers for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));

drop policy if exists "pd_autonomy_own" on public.pd_autonomy_settings;
create policy "pd_autonomy_own" on public.pd_autonomy_settings for all
  using (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.pd_stores s where s.id = store_id and s.user_id = auth.uid()));
