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
