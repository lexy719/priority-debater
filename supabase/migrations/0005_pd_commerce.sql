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
