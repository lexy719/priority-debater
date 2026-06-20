-- ============================================================================
-- Reset test credit data → clean state for release
-- Run in Supabase dashboard → SQL Editor.
-- ----------------------------------------------------------------------------
-- The credit_ledger rows you see in /credits are REAL transactions from your
-- own testing (charges + refunds), not seed data. This wipes that test history
-- and leaves each account in the clean signup state (50 credits, one bonus row).
-- ============================================================================

-- OPTION A — reset ONE account (recommended). Replace the email.
begin;
  delete from public.credit_ledger
  where user_id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');

  update public.profiles
  set credits = 50, updated_at = now()
  where id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');

  insert into public.credit_ledger (user_id, delta, reason, balance_after)
  select id, 50, 'signup_grant', 50
  from auth.users where email = 'YOUR_EMAIL@example.com';
commit;


-- OPTION B — nuke ALL test transactions for EVERY account before launch.
-- Uncomment to run. Use only on a pre-launch project with no real customers.
-- begin;
--   truncate public.credit_ledger;
--   update public.profiles set credits = 50, updated_at = now();
--   insert into public.credit_ledger (user_id, delta, reason, balance_after)
--   select id, 50, 'signup_grant', 50 from public.profiles;
-- commit;
