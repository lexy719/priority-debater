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
