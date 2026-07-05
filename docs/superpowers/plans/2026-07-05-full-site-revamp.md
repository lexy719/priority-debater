# Full Site Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring every public + commerce-dashboard page to full conformance with `docs/design-system.md`, `docs/pd-frontend-build-brief.md`, and `docs/pd-commerce-full-design.md` — fixing real design/logic defects, building the two missing pages, and verifying each with a real browser screenshot.

**Architecture:** Redesign-in-place on top of the existing (already-solid) `--fk-*` token foundation in `src/app/globals.css`. Shared chrome (`CommerceShell`, `SiteNav`, `ForkTabBar`) is locked first as Wave 0 so per-page agents never collide on shared files. Each page is an isolated worktree branch touching only its own route file(s); merges are serialized through the human checkpoint.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@theme inline` bridge → `bg-fk-*`/`text-fk-*`), TypeScript, `lib/commerce/data` localStorage repo, Playwright MCP + preview tools for verification, recharts (Monitor charts).

## Global Constraints

These apply to EVERY task. Copied from `docs/design-system.md` (authoritative).

- **Zero border-radius.** `--radius: 0px` globally; never `rounded-*` except `rounded-none`.
- **Hard cuts, not eases.** State changes (hover swaps, tab switches) use `transition: none`. `transition` allowed ONLY for small hover affordances (arrow nudge, border color), ≤ 200ms.
- **Alternating black/cream bands.** Heroes are ALWAYS black (`--fk-black`). Never two same-color bands adjacent.
- **Exactly one yellow (`--fk-yellow`) CTA per page.** Two yellow elements = one is wrong. Secondary = ghost (bordered/transparent) or red.
- **Blue (`--fk-blue`) = data/primary/at-risk. Red (`--fk-red`) = fail/invisible/destructive. Green/amber = small state chips only, never section backgrounds.**
- **Mono metadata everywhere** (JetBrains Mono): timestamps, counters, step numbers `01 02 03` (never icons), eyebrows/kickers, table numerics. Eyebrows: `font-mono text-[11px] uppercase tracking-[0.32em]` at 45–70% opacity.
- **Anton** for display headlines (uppercase, condensed, tight leading). **Inter** for body. Hero scale `text-[clamp(2.75rem,8vw,7rem)]`.
- **No decoration:** no gradients, no soft/blurred shadows (hard offsets only via `.shadow-hard`), no icon soup, no stock illustration. Only sanctioned texture: `.grid-paper`, `.grid-paper-dark`, `.grid-bg`, `.shadow-hard`, `.corner-ticks`.
- **New code uses `--fk-*` vars / `fk-` utilities only.** Never add new `--pd-*`/`--signal-*`/`--c-*` usages (frozen legacy aliases).
- **Container widths:** `max-w-[1120px]` content pages; `max-w-[1400px]` nav/dashboard shells. Section rhythm: `py-24 lg:py-36` heroes, `py-16 lg:py-24` content bands. Dividers: 1px hairlines only.
- **Copy is fixed by the docs.** Landing/pricing/Command-Center persuasive copy must be checked with `conversion-copywriter` for wording/persuasion structure — but headline/verdict/pricing wording that the docs specify verbatim is authoritative and must not be reinvented.
- **Per-page skill pipeline, in this exact order, before a page is "done":** `web-designer`+`brutalist-skill` (design intent) → `baseline-ui` (spacing/hierarchy cleanup) → `fixing-accessibility` → `fixing-motion-performance` → `taste-skill` (final anti-slop/variance/density gate). Marketing pages additionally run `conversion-copywriter`.
- **Verification gate (non-negotiable):** no page is reported done without a Playwright/preview screenshot at desktop (1280) AND mobile (375) showing the fix, plus a console-error check. "Seems right" is never sufficient.

---

## Wave 0 — Shared foundation (do FIRST, in main worktree, commit before dispatching any page agent)

### Task 0: Lock shared chrome + confirm tokens

**Files:**
- Verify (no change expected): `src/app/globals.css` (`--fk-*` block + `@theme inline` bridge — already conformant).
- Modify as needed: `src/components/commerce/Shell.tsx`, `src/components/SiteNav.tsx`, `src/components/fork/ForkTabBar.tsx`.

**Interfaces:**
- Produces: `CommerceShell({children, subtitle, isDemo, onDemoCleared})`, `SiteNav({subtitle})`, `ForkTabBar` — the stable chrome every page imports. Page agents MUST NOT edit these files (prevents merge conflicts).

- [ ] **Step 1:** Read all three chrome files. Confirm `SiteNav` renders exactly ONE yellow CTA max in-nav (audit finding: nav "SCAN YOUR STORE" is red — acceptable as secondary; ensure no page then adds a second yellow beyond its own hero CTA).
- [ ] **Step 2:** Confirm `ForkTabBar` COMMERCE/VALIDATION labels meet contrast on their band (audit: VALIDATION label reads faint). Bump inactive-label opacity to ≥ 60% or use `--fk-muted` on the correct background. Hard-cut active/inactive (no fade).
- [ ] **Step 3:** Verify dev server boots and both `/` and `/commerce` render. `preview_start` name `dev`.
- [ ] **Step 4:** Commit: `chore(chrome): lock shared commerce/fork chrome before page revamp`.

---

## Wave 1 — Entry pages (3 independent worktrees, dispatch in parallel)

### Task 1: Fork Picker (`/`) — VERIFY + minor fix (do NOT rebuild)

**Files:** Modify `src/app/page.tsx`.

**Audit finding:** Already a faithful, on-spec brutalist split-screen (hard-cut hover, mono eyebrows, instant nav). Only defect: top "PICK A FORK TO CONTINUE" label uses `mix-blend-difference` and half-vanishes over the divider.

- [ ] **Step 1:** Replace `mix-blend-difference` on the top label with an explicit always-legible treatment (e.g. a small solid black chip with cream mono text, centered above the split) so it's readable over both halves. Keep it `pointer-events-none`, keep hard cuts.
- [ ] **Step 2:** Run pipeline (`fixing-accessibility` focus: the label contrast; `taste-skill` to confirm no regression).
- [ ] **Step 3:** Verify: screenshot `/` at 1280 + 375. Label legible over both halves; hover still hard-cuts to blue (left)/red (right). Console clean.
- [ ] **Step 4:** Commit: `fix(fork-picker): legible entry label over both halves`.

### Task 2: Commerce Landing (`/commerce`) — REBUILD hero band, keep how-it-works

**Files:** Modify `src/app/commerce/page.tsx`. Reference the current file for the correct copy (it's already the doc copy) — the DEFECT is styling, not content.

**Audit finding (confirmed via screenshot):** Hero renders on CREAM with WHITE text → subhead, blue-bordered stat block, and "€ recovered this month" metadata strip are all invisible. Design system requires a BLACK hero (§3, brief §4.1). The "How it works" 4-step cream band below is correct and on-spec.

**Doc-specified section order (brief §4.1, keep copy verbatim):**
1. Black hero: Anton headline "Your store is INVISIBLE to AI shoppers." (INVISIBLE in `--fk-yellow`, rest cream), Inter subhead (the sourced Shopify Q1-2026 stat — "AI-driven traffic to Shopify stores grew 8x YoY, AI-search orders up ~13x since Jan 2025"), single yellow CTA "Scan your store — free" → `/scan`, mono metadata counter strip.
2. Cream: Scan → Fix → Recover, three/four mono-numbered columns (no icons).
3. Black: social-proof / leaderboard teaser ("See how [category] brands rank").
4. Cream: pricing teaser, 3 cards (Free €0 / Starter €19 / Growth 0%+perf, Growth highlighted), link `/commerce/pricing`.
5. Footer: minimal, mono, docs/store links.

- [ ] **Step 1:** Rebuild Section 1 as a black band (`bg-fk-black`): cream headline with yellow `INVISIBLE`, cream/muted subhead (readable), stat block with a blue left-border and readable cream mono text, mono counter strip at `text-fk-muted`. Verify alternation stays black→cream→black→cream.
- [ ] **Step 2:** Confirm exactly ONE yellow element (the hero CTA). The Growth pricing-card CTA in Section 4 must be ghost/blue or link-style, NOT a second yellow. (Design system: one yellow per page.)
- [ ] **Step 3:** Run full pipeline incl. `conversion-copywriter` (persuasion structure of hero + pricing framing; do not alter doc-fixed numbers).
- [ ] **Step 4:** Verify: screenshot 1280 + 375. Hero text fully legible on black; single yellow CTA; bands alternate; console clean.
- [ ] **Step 5:** Commit: `fix(commerce-landing): black hero, restore legibility, single yellow CTA`.

### Task 3: Validation Landing (`/validation`) — AUDIT then conform

**Files:** Modify `src/app/validation/page.tsx`.

**Doc spec (brief §Page 3 / design §Validation Main):** Black hero — eyebrow `BEFORE YOU BUILD IT`, Anton headline "Is this idea worth building?", Inter subhead, mono input (placeholder "e.g. an AI agent that reorders pet food automatically"), CTA `VALIDATE`. Cream how-it-works 3 steps. Sample-output preview card (idea→verdict→2–3 reasons). Closing line "Free to try. No signup required for your first idea." ForkTabBar present.

- [ ] **Step 1:** Screenshot current `/validation` first (audit-first). Record which sections are on-spec vs off (esp. hero must be black, single yellow CTA = VALIDATE, input uses `.pd2-input`/`.pd-input` mono pattern).
- [ ] **Step 2:** Fix only what deviates from the spec above; keep on-spec sections. Ensure hard-cut ForkTabBar, alternating bands, one yellow CTA.
- [ ] **Step 3:** Run pipeline incl. `conversion-copywriter`.
- [ ] **Step 4:** Verify: screenshot 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(validation-landing): conform hero + input to design system`.

**CHECKPOINT after Wave 1:** human reviews 3 pages' screenshots before Wave 2.

---

## Wave 2 — Free-scan funnel (2 worktrees)

### Task 4: Free Scan (`/scan`) — conform

**Files:** `src/app/scan/page.tsx`.
**Doc spec (§4.2):** No login wall, store-URL input only. Black bg, live mono log feed ("Checking ChatGPT… Checking Gemini… Checking Perplexity…") appended with hard cuts + blinking cursor (`.animate-blink`/`.pd-blink`). Result screen (cream): verdict + €/month top-line only; specific fixes blurred/locked behind yellow CTA "Connect your store to unlock fixes" → `/commerce/connect`. Edge cases (brief §6): unreachable URL message, partial-provider-timeout note, floor/cap on tiny catalogs.

- [ ] **Step 1:** Audit-screenshot current `/scan` (both scan + result states). 
- [ ] **Step 2:** Conform: black scan state with mono log + cursor (hard-cut append), cream result state, single yellow unlock CTA, blurred fixes. Keep existing scan logic in `lib/commerce/scan`.
- [ ] **Step 3:** Pipeline (esp. `fixing-motion-performance` for the log feed — no layout thrash; use compositor-friendly props).
- [ ] **Step 4:** Verify both states at 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(scan): brutalist live-log scan + locked result`.

### Task 5: Connect (`/connect` → `/commerce/connect`) — conform

**Files:** `src/app/commerce/connect/page.tsx`.
**Doc spec (§4.3):** Platform picker logo grid (Shopify, WooCommerce, BigCommerce, Magento, "My store isn't listed" → feed/CSV). Native OAuth/key card, cream, single centered card, mono trust line "Read + write access to product catalog only. Reversible. Disconnect anytime." Generic mode → single URL/feed input + export-mode note.

- [ ] **Step 1:** Audit-screenshot. 
- [ ] **Step 2:** Conform to logo-grid + centered card + trust line; connectivity framed as free/bundled (never paywalled — §1.3). One yellow CTA (the connect action).
- [ ] **Step 3:** Pipeline.
- [ ] **Step 4:** Verify 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(connect): platform picker + trust-line conform`.

**CHECKPOINT after Wave 2.**

---

## Wave 3 — Command Center (single focused worktree; highest-value surface)

### Task 6: Dashboard / Command Center (`/commerce/dashboard`)

**Files:** `src/app/commerce/dashboard/page.tsx` (+ small presentational components under `src/components/commerce/` if a section grows unwieldy — coordinate so no other agent touches them).

**Audit finding:** Empty state ("NO STORE CONNECTED YET") is coherent and on-brand with a working "Load demo store" path. Must evaluate the FULL populated state (click Load demo store first). Anton headline shows red/blue chromatic fringing — confirm intentional glitch treatment vs. rendering artifact; if artifact, remove.

**Doc spec (§1.7 + §4.4) — this is NOT a single-number dashboard:**
1. **"Your Environment" strip** (§1.6): compact module tiles — active ones show live headline number (Recovery €X/mo, Return-Risk €Y prevented, Restock N alerts); locked ones grayed with unlock condition from the §1.6 thresholds table.
2. **"Today's Actions"** — single impact-ranked list pulling actionable output of every module (push fix €X, approve Studio post, restock warning). PRIMARY work surface.
3. **Live Studio content queue** inline (drafted/scheduled/published) — a lane on the home screen, not a separate tab.
4. **Product grid** (secondary, below Actions): cream, color-coded red=Invisible / blue=At Risk / black-on-cream=Winning, sorted by €-impact.
5. Top nav mono tabs: Monitor / Competitors / Content / Settings / Billing.

- [ ] **Step 1:** Load demo store; screenshot the full populated Command Center. Map current layout against the 5 required elements; list gaps (esp. Environment strip + Today's Actions + inline Studio queue — the parts most likely missing).
- [ ] **Step 2:** Build/adjust the Environment strip (data from `module_unlocks` / store in `lib/commerce/data`), Today's Actions ranked list, inline Studio queue, and product grid. One yellow CTA only (the single highest-impact action or "Connect"); everything else ghost/blue.
- [ ] **Step 3:** Resolve the headline chromatic-fringe (keep only if deliberate + accessible).
- [ ] **Step 4:** Full pipeline incl. `conversion-copywriter` for how numbers are framed (§1.7 "framing of numbers").
- [ ] **Step 5:** Verify populated + empty states at 1280 + 375; console clean; no dead vertical space breaking rhythm.
- [ ] **Step 6:** Commit: `feat(command-center): environment strip + today's actions + studio queue`.

**CHECKPOINT after Wave 3** (biggest surface — review carefully).

---

## Wave 4 — Product fix + Monitor (2 worktrees)

### Task 7: Product Detail / Fix (`/commerce/product/[id]`)

**Files:** `src/app/commerce/product/[id]/page.tsx`.
**Doc spec (§4.5 + §12.1):** Split-screen diff — left = current data as agents see it (mono/code style, red-highlighted gaps: missing GTIN, thin description, no structured data), right = proposed fix. Yellow CTA "Push to [Platform]" (or "Download fix" in export mode); secondary text-only "Edit before pushing." Post-push confirmation: blue banner "Live. We'll show impact within 7 days." + mono timestamp. Agent-Ready tab (second lens, same product). Use `.pd-*` diff-panel recipe from design-system §5.

- [ ] **Step 1:** Audit-screenshot with demo product.
- [ ] **Step 2:** Conform diff panel (two mono panes `grid md:grid-cols-2 gap-px`, left gaps `bg-fk-red/10 text-fk-red`), Agent-Ready tab, single yellow push CTA, blue confirmation state.
- [ ] **Step 3:** Pipeline.
- [ ] **Step 4:** Verify diff + Agent-Ready tab + post-push state, 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(product-fix): diff panel + agent-ready tab + push states`.

### Task 8: Monitor (`/commerce/monitor`)

**Files:** `src/app/commerce/monitor/page.tsx`.
**Doc spec (§4.6 + §12.3):** Line chart (blue) of €-recovered over time (revenue is the primary axis; visibility % secondary/tooltip only). Attribution breakdown by layer (Direct agent checkout / Referral-matched / Estimated) each with its own mono confidence label. Weekly-digest preview + email/WhatsApp toggle. Restock/Demand Signals card (velocity → "sold out in ~9 days").

- [ ] **Step 1:** Audit-screenshot.
- [ ] **Step 2:** Conform recharts line chart to blue/mono brutalist styling (no rounded, no gradient fills), three labeled attribution layers, restock card, digest toggle.
- [ ] **Step 3:** Pipeline (`fixing-motion-performance` for chart render).
- [ ] **Step 4:** Verify 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(monitor): revenue-first chart + attribution layers + restock`.

**CHECKPOINT after Wave 4.**

---

## Wave 5 — Missing pages + trust/settings/pricing (5 worktrees)

### Task 9: Competitor Watch (`/commerce/competitors`) — NEW PAGE

**Files:** Create `src/app/commerce/competitors/page.tsx`.
**Doc spec (§4.7):** Cream section, table format (mono numbers): your product vs. top-cited competitor in category side by side, with the specific data gap called out ("They have GTIN + 3 lifestyle images. You have neither."). Growth-only; honest bootstrapping note when <3 comparable stores exist in category (§1.6 threshold). Wrap in `CommerceShell`.

- [ ] **Step 1:** Build the comparison table (mono numerics, hairline dividers, red for your gaps). Pull/mocked from `lib/commerce/data`. Growth-gate + empty-category honest message.
- [ ] **Step 2:** Pipeline.
- [ ] **Step 3:** Verify 1280 + 375; console clean.
- [ ] **Step 4:** Commit: `feat(competitors): competitor watch comparison table`.

### Task 10: Content Hub (`/commerce/content`) — NEW PAGE

**Files:** Create `src/app/commerce/content/page.tsx`.
**Doc spec (§4.8 + §12.5):** List of generated content pieces (buyer's guides, comparisons, FAQ blocks, video drafts) with status Draft/Published/Live. Each previewable before push (same diff-review pattern as fixes). Growth-only. Content types text/image/video (from `content_items`). Wrap in `CommerceShell`.

- [ ] **Step 1:** Build content-queue list with status chips (mono, per §5 status-chip recipe), preview affordance, single yellow CTA (e.g. "New draft" or top action). Growth-gate.
- [ ] **Step 2:** Pipeline.
- [ ] **Step 3:** Verify 1280 + 375; console clean.
- [ ] **Step 4:** Commit: `feat(content-hub): studio content queue with statuses`.

### Task 11: Billing (`/commerce/billing`) — conform (trust-critical)

**Files:** `src/app/commerce/billing/page.tsx`.
**Doc spec (§4.9 + §1.5):** Full ledger — every order ID that contributed to the bill, its attribution layer (1/2/3), exact euro amount; drill into raw order (nothing summarized without drill-down). Current plan, upgrade/downgrade, Growth cap progress bar toward €300/mo. Billing derived from `attribution_events` via `computeBillingRecord()`/`listBillableEvents()` — never stored/recomputed-summary.

- [ ] **Step 1:** Audit-screenshot.
- [ ] **Step 2:** Conform ledger table (mono, layer labels, per-euro traceability), cap progress bar (blue), plan controls. One yellow CTA (upgrade) max.
- [ ] **Step 3:** Pipeline.
- [ ] **Step 4:** Verify 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(billing): traceable attribution ledger + cap indicator`.

### Task 12: Settings (`/commerce/settings`) — conform

**Files:** `src/app/commerce/settings/page.tsx`.
**Doc spec (§4.10 + §12.6):** AI channel toggles (ChatGPT/Gemini/Perplexity/Copilot). Notification channel (email/WhatsApp). Dedicated "Autonomy" section (per-content-type auto-approve, default OFF, min-track-record gate, catalog changes never auto-approvable). Danger zone: disconnect store, delete account — standard, unstyled, no dark patterns.

- [ ] **Step 1:** Audit-screenshot.
- [ ] **Step 2:** Conform toggles (hard-cut switches), Autonomy section (defaults false, gated), plain danger zone. `autonomy_settings` from data layer.
- [ ] **Step 3:** Pipeline.
- [ ] **Step 4:** Verify 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(settings): channels + autonomy controls + danger zone`.

### Task 13: Pricing (`/commerce/pricing`) — conform

**Files:** `src/app/commerce/pricing/page.tsx`.
**Doc spec (§1.2):** 3 tiers — Free Scan €0, Starter €19/mo flat, Growth €0 base + 8% AI-attributed incremental (capped €300/mo). Connectivity always free/bundled, never a line item (§1.3). Growth visually recommended. Alternating bands; ONE yellow CTA (Growth). Run `conversion-copywriter` on tier framing (do not change the fixed prices).

- [ ] **Step 1:** Audit-screenshot.
- [ ] **Step 2:** Conform 3-card pricing (mono numerics, hard shadows on cream, Growth highlighted), single yellow CTA, correct copy/prices.
- [ ] **Step 3:** Pipeline incl. `conversion-copywriter`.
- [ ] **Step 4:** Verify 1280 + 375; console clean.
- [ ] **Step 5:** Commit: `fix(pricing): three-tier brutalist pricing + single CTA`.

**CHECKPOINT after Wave 5.**

---

## Final — End-to-end verification (main worktree, after all merges)

### Task 14: Full-flow Playwright click-through

- [ ] **Step 1:** Playwright click-through: Fork Picker → Commerce → (Scan) → Command Center (load demo) → open a product fix → Billing → Settings. Screenshot each at 1280 AND 375.
- [ ] **Step 2:** Confirm on every page: no dead/empty space breaking rhythm; primary action has MORE visual weight than secondary; the page's central content (idea/transcript/fix/ledger) stays present when scrolled past the hero; exactly one yellow CTA; bands alternate; console clean.
- [ ] **Step 3:** `npm run build` passes (no type/lint breakage from the rebuild).
- [ ] **Step 4:** Report: one line per page — what changed + any assumption made where docs were silent — with screenshot references.

---

## Self-Review notes

- **Spec coverage:** brief Pages 1–3 → Tasks 1–3; design §4.1–4.10 → Tasks 2,4,5,6,7,8,9,10,11,12; §1.7 Command Center → Task 6; §12.1 Agent-Ready → Task 7; §12.5 video content → Task 10; §12.6 Autonomy → Task 12; §1.2/1.3 pricing → Task 13. Public leaderboard page is referenced as a teaser only (not yet a built route) — intentionally out of scope, noted on landing (Task 2 §3).
- **Missing-page gap closed:** Competitor Watch + Content Hub (Tasks 9–10) — the two IA routes with no current file.
- **Conflict-avoidance:** Wave 0 locks shared chrome; page agents touch only their own route file(s). If a page needs a new shared component, that component is created inside the same task and no other in-flight task imports it until merged.
- **Verification is evidence-based:** every task ends in a real screenshot gate + console check; final Task 14 is the doc-mandated end-to-end click-through.
