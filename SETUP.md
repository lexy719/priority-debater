# Setup — Accounts, Credits & Payments

The app runs **without** any of this configured (demo mode: unmetered, logged-out).
The moment the keys below exist, auth + server-enforced credits turn on automatically.

Status: `.env.local` already has the **Supabase URL + anon key**. You still need to:
1. add the **service-role key**, 2. **run the migration**, 3. **enable the auth providers**, 4. (for payments) **set up Stripe**.

---

## 1. Supabase — database + auth

### 1a. Keys
In the Supabase dashboard → **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` ✅ already set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ already set
- **`SUPABASE_SERVICE_ROLE_KEY`** → copy the `service_role` secret into `.env.local` (needed by the Stripe webhook to credit accounts). **Keep this secret — never commit it.**

### 1b. Run the migration (REQUIRED — credits don't work until you do)
Supabase dashboard → **SQL Editor** → paste the contents of
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.

This creates: `profiles` (holds the credit balance), `credit_ledger` (audit trail),
the `handle_new_user` trigger (grants **50 free credits** on signup), and the
`spend_credits` / `refund_credits` / `add_credits` functions. It's safe to re-run.

### 1c. Enable auth providers
Supabase → **Authentication → Providers**:
- **Email** → enable. (For fastest testing, turn **"Confirm email" OFF** so signups log in immediately. Turn it back on for production.)
- **Google** → enable, then paste a Google OAuth **Client ID + Secret**:
  - Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** (Web application).
  - Authorized redirect URI: `https://wpuzmutgiiltmxghztqs.supabase.co/auth/v1/callback`

### 1d. URL configuration
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (dev) — change to your real domain for prod.
- **Redirect URLs**: add `http://localhost:3000/auth/callback` (and the prod equivalent).

✅ **Verify**: restart `npm run dev`, open `/signup`, create an account → you should land logged-in
with **50 credits** shown in the navbar badge. Running a validation should drop it to 40 (server-side).

---

## 2. Stripe — one-time credit packs (payments)

> Not required to launch the free tier; needed for buying credits. Until configured,
> the `/pricing` "Buy" buttons return a friendly "payments not configured" message.

1. Create a Stripe account → **test mode** for now.
2. **Products → add 3 products**, each a one-time price (matching `CREDIT_PACKS` in
   [`src/lib/credits/costs.ts`](src/lib/credits/costs.ts)):
   - Explorer — €9.99 → copy its Price ID into `STRIPE_PRICE_EXPLORER`
   - Builder — €24.99 → `STRIPE_PRICE_BUILDER`
   - Founder — €49.99 → `STRIPE_PRICE_FOUNDER`
3. **Developers → API keys** → copy the **Secret key** into `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR_DOMAIN/api/stripe/webhook` (locally use `stripe listen --forward-to localhost:3000/api/stripe/webhook`)
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

✅ **Verify**: `/pricing` → buy a pack with test card `4242 4242 4242 4242` (any future date/CVC) →
`/account` shows the credits added. Replaying the webhook does **not** double-credit (idempotent on session id).

---

## 3. Upstash (optional) — rate limiting

For per-IP/user rate limits on the paid AI routes (Phase F): create an Upstash Redis DB →
copy `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` into `.env.local`.

---

## Credit economy (tune in one place)

All prices live in [`src/lib/credits/costs.ts`](src/lib/credits/costs.ts):
signup grant **50**; validation **10**, debate **10**, brand/launch/campaign **15**,
landing/pitch **10**, rescore **5**. Packs: 150 / 700 / 1500 credits. Change a number, redeploy — done.
The DB default in the migration (`profiles.credits default 50`) must match `SIGNUP_GRANT`.
