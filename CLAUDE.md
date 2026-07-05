# Priority Debater — project instructions

Next.js App Router + Tailwind v4 + TypeScript. Two product forks behind a split-screen fork
picker at `/`:

- **Commerce** (`/commerce/*`, `/scan`) — AI Commerce Intelligence: scan → verdict → fix →
  recover loop for online stores. Product spec: `docs/pd-commerce-full-design.md` (authoritative
  for copy, pricing, thresholds, data model). Frontend brief: `docs/pd-frontend-build-brief.md`.
- **Validation** (`/validation`, `/debate`, `/results`, studio flow pages) — idea validation via
  the five-persona debate chamber.

## Design system (mandatory)

**All UI work must follow `docs/design-system.md`.** Canonical tokens are the `--fk-*` family in
the first `:root` block of `src/app/globals.css`. `--pd-*`, `--signal-*`, `--c-*` are frozen
legacy aliases — never add new usages. Key rules: zero border-radius, hard-cut state changes,
alternating black/cream sections, exactly one yellow CTA per page, JetBrains Mono for all
metadata/numbers, Anton for display headlines.

## Commerce architecture

- **Client store:** `src/lib/commerce/data/store.ts` — localStorage repository over the 11
  entities in `data/types.ts`. Mirrors `supabase/migrations/0005_pd_commerce.sql` 1:1 so it can
  swap to server persistence later (SERVICE_ROLE_KEY currently empty). The swap seam is the
  `useCommerceStore` hook + `data/credentials.ts`.
- **API routes are stateless** (`src/app/api/commerce/*`) — they never persist; the client
  writes results into the localStorage repo. Connector credentials (`ConnectorStoreRef`) are
  posted per request from the client-side credentials store.
- **Commerce AI = OpenAI** (`OPENAI_API_KEY`, funded) via the conventions in
  `src/lib/agents/run.ts`. Validation-fork AI also runs on OpenAI.
- **Billing is derived, never stored:** always `computeBillingRecord()` /
  `listBillableEvents()` over `attribution_events`. Only attribution layers 1–2 are billable;
  layer 3 is directional only. Every billed euro must trace to a real order id.
- **Connectors** (`src/lib/commerce/connectors/`): Shopify OAuth, WooCommerce keys, generic
  feed/CSV. Connectivity is free/bundled on every platform — never paywalled. Fixes are
  review-before-push and reversible (`writeFix` captures `previous`).
- Nothing auto-publishes without explicit per-content-type autonomy settings
  (`autonomy_settings`, default off); catalog changes are never auto-approvable.

## Conventions

- Path alias `@/*` → `src/*`. Fonts come from `src/app/layout.tsx` CSS vars — don't re-import.
- Pages opt into `SiteNav` explicitly (no global nav); fork-picker/landing pages use
  `ForkTabBar` instead.
- Validation credits/pricing live at `/pricing` (credits product); commerce pricing is
  `/commerce/pricing` — keep the two forks' routes separate.
