# PD — Frontend Build Brief (for Emergent)
*Main page redesign: fork picker + two fork landing pages. Content and design tokens only — no backend, pricing logic, or data model needed for this pass.*

---

## Design System

**Colors:**
- Black: `#0A0A0A`
- Cream: `#F2EEE3`
- Yellow (CTA only): `#FFD400`
- Electric blue (data/primary): `#0047FF`
- Red (fail/invisible states): `#FF2B2B`

**Type:**
- Display/headlines: **Anton** (condensed, bold, uppercase-leaning)
- Body: **Inter**
- Metadata/mono/numbers/labels: **JetBrains Mono**

**Rules:**
- Zero border-radius everywhere, no exceptions
- Sections alternate black / cream backgrounds
- Yellow reserved for exactly one CTA per page — never used decoratively
- State changes (hover, page switches) should be abrupt/instant, not eased or faded — brutalism reads as intentional through hard cuts, not smooth transitions

---

## Page 1: Fork Picker (site entry, before either main page)

Full-bleed split screen, two halves, no header/nav/footer.

**Left half — Commerce:**
- Eyebrow (mono, small): `01 — LIVE PRODUCT`
- Headline (display, large): `Commerce`
- One-line description: "AI shopping-agent visibility, fixes, and revenue recovery for online stores."

**Right half — Validation:**
- Eyebrow: `02 — EARLY STAGE`
- Headline: `Validation`
- One-line description: "Test a new idea against the market before you build it."

**Top center, small, persistent label:** `PICK A FORK TO CONTINUE`

Clicking either half navigates instantly to that fork's main page — no confirmation step, no loading screen.

---

## Page 2: Commerce Main Page (loads when Commerce is picked)

**Section 1 — Hero (black background):**
- Headline (display): "Your store is **INVISIBLE** to AI shoppers." — the word INVISIBLE in yellow, rest in cream
- Subhead (body, one sentence): AI-originated shopping orders have grown sharply in 2026 — most small stores have no idea if they show up at all
- CTA (yellow button): `SCAN YOUR STORE — FREE`
- Metadata strip (mono, below fold): live counter, e.g. "€[X] recovered for merchants this month"

**Section 2 — How it works (cream background), 3–4 short steps:**
- "Scan — we check what ChatGPT, Gemini, and Perplexity say about your products."
- "Verdict — plain language, not a score: invisible, at risk, or winning."
- "Fix — we rewrite what's missing and push it live. You approve every change."
- "Recover — every euro traced back to a real order in your own store."

**Section 3 — Social proof (black background):**
- Headline: "See how [category] brands rank."
- Link/CTA to public leaderboard page (once live)

**Section 4 — Pricing teaser (cream background), 3 cards:**
- Free Scan — €0 — "One-time audit, no card needed"
- Starter — €19/mo — "Full dashboard, weekly re-scan, manual fixes"
- Growth — "0% base + performance fee" — "Auto-push, competitor watch, content generation" (visually highlighted as recommended)
- Each card links to full pricing page

**Footer:** minimal, mono type, docs/App Store links only

---

## Page 3: Validation Main Page (loads when Validation is picked)

**Section 1 — Hero:**
- Eyebrow (mono): `BEFORE YOU BUILD IT`
- Headline (display): "Is this idea worth building?"
- Subhead: "Describe it in a sentence. We'll check for existing competitors, real demand signals, and market timing — before you spend a weekend building it."
- Input field, placeholder text: "e.g. an AI agent that reorders pet food automatically"
- CTA button: `VALIDATE`

**Section 2 — How it works, 3 steps:**
- "Describe it — one sentence, no pitch deck needed."
- "We check it — competitors, search demand, timing, existing funded companies doing the same thing."
- "You get a verdict — worth building, needs a different angle, or already crowded. Plain language, not a score."

**Section 3 — Sample output preview:**
One example card: idea (one line) → verdict (one line) → 2–3 bullet reasons. Use a placeholder example for now.

**Section 4 — Closing line:** "Free to try. No signup required for your first idea."

---

## Cross-Fork Navigation (once inside either main page)

Small persistent tab bar, top of page, mono labels: `COMMERCE` / `VALIDATION`. Clicking switches instantly (hard cut, no fade) between the two main pages without returning to the fork picker.
