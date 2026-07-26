-- Priority Debater — accounts, credits, ledger.
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent-ish:
-- safe to re-run. NOTE: the 50 signup grant below must match SIGNUP_GRANT in
-- src/lib/credits/costs.ts.

-- ── profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  credits    int  not null default 50,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may READ their own profile. There is deliberately NO update/insert
-- policy: credits can only change via the SECURITY DEFINER functions below, so
-- a client can never inflate its own balance.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- ── append-only credit ledger (audit trail) ────────────────────────────────
create table if not exists public.credit_ledger (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  delta             int  not null,
  reason            text not null,
  balance_after     int  not null,
  stripe_session_id text,
  created_at        timestamptz not null default now()
);

-- Idempotency guard for Stripe webhooks: one ledger row per checkout session.
create unique index if not exists credit_ledger_session_uniq
  on public.credit_ledger (stripe_session_id)
  where stripe_session_id is not null;

alter table public.credit_ledger enable row level security;
drop policy if exists "ledger_select_own" on public.credit_ledger;
create policy "ledger_select_own" on public.credit_ledger
  for select using (auth.uid() = user_id);

-- ── new-account grant ───────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, new.email, 50)
  on conflict (id) do nothing;

  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (new.id, 50, 'signup', 50);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── spend (runs as the authed user) ─────────────────────────────────────────
create or replace function public.spend_credits(p_amount int, p_reason text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_balance int;
begin
  if v_uid is null then return json_build_object('ok', false, 'balance', 0); end if;
  if p_amount <= 0 then return json_build_object('ok', false, 'balance', null); end if;

  -- Atomic: only decrements when the balance can cover it.
  update public.profiles
     set credits = credits - p_amount
   where id = v_uid and credits >= p_amount
  returning credits into v_balance;

  if v_balance is null then
    select credits into v_balance from public.profiles where id = v_uid;
    return json_build_object('ok', false, 'balance', coalesce(v_balance, 0));
  end if;

  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (v_uid, -p_amount, p_reason, v_balance);

  return json_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- ── refund (runs as the authed user) ────────────────────────────────────────
create or replace function public.refund_credits(p_amount int, p_reason text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_balance int;
begin
  if v_uid is null or p_amount <= 0 then return json_build_object('ok', false); end if;

  update public.profiles set credits = credits + p_amount
   where id = v_uid
  returning credits into v_balance;

  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  values (v_uid, p_amount, p_reason, v_balance);

  return json_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- ── add credits (service role only; idempotent on stripe session) ───────────
create or replace function public.add_credits(p_user uuid, p_amount int, p_reason text, p_session text)
returns json language plpgsql security definer set search_path = public as $$
declare v_balance int;
begin
  if p_session is not null and exists (
    select 1 from public.credit_ledger where stripe_session_id = p_session
  ) then
    select credits into v_balance from public.profiles where id = p_user;
    return json_build_object('ok', true, 'duplicate', true, 'balance', coalesce(v_balance, 0));
  end if;

  update public.profiles set credits = credits + p_amount
   where id = p_user
  returning credits into v_balance;
  if v_balance is null then return json_build_object('ok', false); end if;

  insert into public.credit_ledger (user_id, delta, reason, balance_after, stripe_session_id)
  values (p_user, p_amount, p_reason, v_balance, p_session);

  return json_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- ── execute grants ──────────────────────────────────────────────────────────
grant execute on function public.spend_credits(int, text)  to authenticated;
grant execute on function public.refund_credits(int, text) to authenticated;
-- add_credits is service-role only (called past RLS by the webhook); keep it
-- away from anon/authenticated.
revoke all on function public.add_credits(uuid, int, text, text) from public;
