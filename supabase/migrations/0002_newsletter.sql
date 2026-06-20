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
