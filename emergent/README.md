# Scoring Engine v2.2 — Web-grounded edition

Same 8-dimension weighted rubric + 2-phase enrichment-then-score pipeline,
but the **enrichment phase is now LIVE WEB SEARCH** instead of model-memory
recall.

## What changed vs. v2.1

| Capability | v2.1 | v2.2 |
|---|---|---|
| API path                                       | Chat Completions       | **Responses API** with `web_search` tool |
| Enrichment source                              | model's training memory | **Live web search at score time**     |
| Stale-data risk                                | high (1–2 yr lag)       | none — current TAM / competitors / regulations |
| Source citations in `assumptions[]`            | ❌                       | ✅ `sourceUrl` + `sourceTitle` per claim |
| `sourcesConsulted[]` footer with clickable URLs| ❌                       | ✅                                       |
| `webSearchUsed` flag in payload                | ❌                       | ✅                                       |
| Cost / scored idea                             | ~$0.002                  | **~$0.012** (search adds ~1¢)            |
| Fallback if search unavailable                 | n/a                      | Falls back to v2.1-style enrichment      |
| Schema version                                 | 2.1                      | 2.2                                      |

## What the founder sees

After scoring a one-line pitch like *"AI clinical scribe for European GPs"*:

- A **🛰 LIVE WEB SEARCH · 4 SOURCES** badge next to the headline.
- The **ASSUMPTIONS** panel now has each claim with a clickable source
  link (`KBV.de`, `Statista`, `EU Commission`, `Crunchbase`, etc.).
- A **SOURCES CONSULTED · 4** footer at the bottom of the card with
  every distinct URL the model touched.
- The per-dimension `ENRICHED` badge now shows a globe icon (live) vs a
  search icon (training memory) so the user knows which it is.

## Cost & latency

- **Model**: `gpt-4o-mini` (configurable via `SCORING_MODEL` env).
- **Web search**: ~$0.01 per scored idea on average. Model is instructed
  to do **1–3 searches maximum** and reuse facts across dimensions.
- **Latency**: ~6–12s for a fresh score (vs ~3s without search).
- **Caching**: per-idea hash in localStorage, same as v2.1 — rescoring
  the same idea is free.

## Files in this zip

```
scoring-v2.2/
├── lib/agents/idea-scoring-v2.ts        ← overwrite (drop-in)
└── components/score/ScoreCardV2.tsx     ← overwrite (drop-in)
```

The `/api/score/route.ts` from v2.0 is **unchanged** — keep using it.

## Install

1. Make sure your `openai` SDK is recent. The Responses API + `web_search`
   tool need `openai` ≥ 4.85:
   ```bash
   yarn add openai@latest
   ```
2. Overwrite the 2 files in this zip.
3. (Optional) Add env switches:
   - `SCORING_MODEL=gpt-4o-mini`  → default (good quality / cheap)
   - `SCORING_MODEL=gpt-4o`       → ~5× cost, ~1.5× quality
   - `WEB_SEARCH_DISABLED=1`      → fall back to v2.1 (no live search)
4. Clear the cache once so old payloads don't render without the new
   `webSearchUsed` / `sourcesConsulted` fields:
   ```js
   localStorage.removeItem("priority-debater-score-v2");
   ```
   Or just hit RESCORE in the UI.

## Backward compatibility

- Endpoint path (`POST /api/score`) and request shape unchanged.
- Response is a strict **superset** of v2.1 — adds optional fields:
  - `webSearchUsed: boolean`
  - `sourcesConsulted: [{url, title?}]`
  - Per-assumption `sourceUrl?` + `sourceTitle?`
- The legacy `toLegacyBlindScores()` bridge still works.

## How the prompt enforces honesty

The agent is explicitly told to:

1. Use `web_search` to look up **category-level facts only** — TAM, named
   incumbents, recent funding rounds, regulatory landscape, typical
   pricing.
2. Attach the live URL to every assumption it scores against.
3. **Never** search for or invent **founder-specific** facts (LOIs,
   advisors, signed customers, capital raised, team experience). Those
   only count when the founder explicitly states them.
4. Keep the search budget tight — **1 to 3 calls max**, reuse facts.

Plus the same v2.1 safeguards:
- Server-side recomputes `overall` from declared weights ±5pts.
- `FOUNDER_ONLY` dimensions (Execution Feasibility, Founder Fit) have
  `enriched=false` forced in the parser regardless of what the model says.
- Founder Fit defaults to 50 (neutral, not punished) when text is silent.

## When web search is *off* (env flag or API failure)

The agent automatically falls back to the v2.1 chat-completions path
(no search, no source URLs). The `webSearchUsed` flag in the response
will be `false` so the UI hides the "LIVE WEB SEARCH" badge and the
SOURCES CONSULTED footer. Everything else still works.

## Final note on the founder UX

You asked the right question. Without web search the agent was making
score-moving claims like *"the EU primary-care digital health market is
€X billion"* from 2023-era training data. With v2.2 those claims are
either backed by a 2025–2026 source the founder can click, or marked as
**user-provided** — never both bluffed and confidently presented.

Now the score isn't just **accurate** — it's **auditable**.
