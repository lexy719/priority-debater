# Deploying PDR

Everything measurable about Commerce is currently measured against our own test
traffic, because nothing is publicly reachable. Deployment is the single change
that turns the whole product from "works" into "provable": real agents can crawl
the stores, feeds become submittable, the audit becomes something a prospect can
run, the daily tick actually ticks, and landing pages become links you can send.

## 0 · Will it actually work once deployed? — checked, not assumed

**A store is not a separate deployment.** Every fabricated business is a route on
this one app: `<your-domain>/store/kilnware-7649ee`. Deploy once and all of them
are live at the same moment, each with its own product pages, feeds, JSON-LD,
MCP endpoint, seller record, checkout and landing pages.

Verified against the live Supabase project:

- **Every repository writes remotely first.** storeRepo · orderRepo · hitRepo ·
  activityRepo · brainRepo · campaignRepo · landingRepo · costRepo ·
  expenseRepo · automationRepo all take the `blobConfigured()` branch and return
  before touching the filesystem, so Vercel's read-only disk is never in the
  path. The `.data/` fallback exists only for a machine with no Supabase keys.
- **KILNWARE's complete state is remote** — store, orders, activity,
  automations, campaigns, landings, expenses, costs, brain and hits. Nothing
  about the business lives only on a laptop.
- **All nine businesses are now in Supabase.** Three (boardrx, medulla, recupo)
  existed only in local `.data/` — which is gitignored and never uploaded — so
  production would have shown six. They were synced up; the register now lists
  nine both locally and remotely.
- **The daily tick fits comfortably in a serverless function**: 6.6s for all
  nine businesses, 0.5s for one. Vercel's cap is 60s.
- **Product imagery needs no storage** — every image is a deterministic SVG
  generated per request at `/store/<slug>/img/<sku>.svg`.
- **One known filesystem write remains**, in the Validation fork's cross-session
  agent memory (`src/lib/agents/agent-memory.ts`). Its caller wraps it in
  try/catch and logs a warning, so a debate still completes on Vercel — but that
  learning will not persist until it is moved to blob storage like the others.

## 1 · What is verified ready

| Thing | State |
|---|---|
| `next build` | passes (85 routes) |
| `tsc --noEmit` | clean |
| Server-side persistence | Supabase Storage bucket `studio` — service key returns 200 against the live project |
| Studio + Commerce generation | `ANTHROPIC_API_KEY` set and working |
| Validation fork | `OPENAI_API_KEY` set and working |
| Scheduled autonomy | `vercel.json` cron → `/api/commerce/tick` at 07:00 daily |

## 2 · The one blocker

`NEXT_PUBLIC_SUPABASE_ANON_KEY` belongs to the **old** Supabase project. Checked
against the configured project it returns **401**:

```
GET https://ewrqmzvfogsgvkcidata.supabase.co/auth/v1/settings   →  401
```

Server writes work (service key → 200), so stores, orders, traffic and brains
persist fine. What breaks is anything a signed-in user does: login, signup, the
account page, credits.

**Fix (1 minute):** Supabase dashboard → the `ewrqmzvfogsgvkcidata` project →
Project Settings → API keys → copy the **publishable** key (starts
`sb_publishable_`) → replace the value of `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
`.env.local` and in the Vercel project's environment variables.

## 3 · Environment variables to set in Vercel

Required for the parts that matter today:

| Key | Why |
|---|---|
| `ANTHROPIC_API_KEY` | Studio + Commerce generation (Claude) |
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side persistence (Storage) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client auth — use the NEW publishable key |
| `OPENAI_API_KEY` | Validation fork (debate, results, chamber) |
| `CRON_SECRET` | recommended: gates `/api/commerce/tick` so only the cron can run it |

Optional / feature-gated (absent = the feature says so honestly):

| Key | Unlocks |
|---|---|
| `HIGGSFIELD_API_KEY` (`key:secret`) | real image/video renders behind the ad engine |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | paid tiers |
| `ELEVENLABS_API_KEY` | HD tribunal voices |
| `UNSPLASH_ACCESS_KEY` | stock imagery in the validation flow |

## 4 · Deploy

```bash
npx vercel link
npx vercel env pull            # sanity: confirm what the project already has
npx vercel --prod
```

Vercel reads `vercel.json` and registers the daily cron automatically. If
`CRON_SECRET` is set, add it to the cron request — either switch the cron path to
`/api/commerce/tick?key=$CRON_SECRET` or rely on Vercel's own cron
`Authorization: Bearer $CRON_SECRET` header, which the endpoint already accepts.

## 5 · Immediately after the first deploy

1. **Re-run the readiness report** on a live store: `/api/store/<slug>/report`.
   The two remaining WARNs (no GTINs, no payment rails) are honest; everything
   else should read PASS against the public origin.
2. **Audit your own store from outside**: `/commerce/visibility` with the public
   URL. It should score high — if it doesn't, the audit is telling the truth and
   the store needs the fix it names.
3. **Submit the feeds** — `/store/<slug>/feed.tsv` to Google Merchant Center,
   `/store/<slug>/feed.jsonl` where an OpenAI-style feed is accepted.
4. **Watch `/commerce/command` → AI COMMERCE** for the first real agent read from
   an agent we did not send ourselves. That is the first honest signal this
   platform has ever had.
5. **Then the measurement gap**: we can audit any store but only measure stores we
   host. Closing it (edge proxy, a snippet, or log ingestion) is the next
   strategic build, and it only makes sense once we are live.
