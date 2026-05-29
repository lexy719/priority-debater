# Agent Functions

## Overview

This document enumerates the AI agent-related source files found in the workspace and describes their exported functions and responsibilities in as much detail as possible.

- Unique agent implementation files: 6
- Duplicate copy detected: 1 (`emergent/lib/agents/idea-scoring-v2.ts`)
- Primary agent folder: `src/lib/agents`

## Agent file list

### 1) `src/lib/agents/idea-scoring-v2.ts`

Exports:
- `Band` — score band type: `weak | interesting | viable | strong | exceptional`
- `Recommendation` — recommendation type: `proceed | proceed-cautiously | refine | pivot | reject`
- `DimensionId` — union of 8 dimension IDs
- `DimensionScore` — shape for a single dimension score object
- `Assumption` — shape for an assumption object used in reports
- `IdeaScoreV2` — full structured output shape of the scoring agent
- `ScoreInput` — input shape for the scoring call
- `DIMENSION_WEIGHTS` — weight mapping for each dimension
- `DIMENSION_LABELS` — human-readable labels for each dimension
- `scoreToBand(score)` — maps numeric score to band label
- `bandToRecommendation(band, executionDifficulty)` — maps band + execution difficulty into a recommendation string
- `scoreIdeaV2(input)` — main async scoring function that calls OpenAI
- `parseAndRepairIdeaScoreV2(raw, webSearchUsed, sourcesConsulted)` — parses model output JSON and repairs missing/invalid fields
- `toLegacyBlindScores(v2)` — converts the v2 idea score into legacy blind scoring shape

Responsibilities:
- Primary scoring engine for startup idea validation.
- Builds and sends a prompt to OpenAI with strict JSON output requirements.
- Supports live web search via OpenAI Responses API and `tools: [{ type: "web_search" }]`.
- Falls back to a chat completion prompt if web search fails.
- Captures whether web search was used and records source URLs.
- Enforces exact JSON object output shape, clamps numeric values, and recomputes overall score if necessary.
- Contains calibration rules for eight dimensions, decoupled signals, and recommendation tiers.
- Provides a stable interface for the rest of the app to score ideas.

### 2) `src/lib/agents/validation-scoring.ts`

Exports:
- `buildScoringRubricBlock(context)` — builds the scoring rubric and instructions for the validation prompt
- `getIndustryContext(topic, position)` — returns industry-specific guidance text based on idea keywords

Responsibilities:
- Produces the scoring rubric text used by idea validation report prompts.
- Encodes scoring rules, band definitions, legacy compatibility rules, and guidance style.
- Adds industry-specific instructions for SaaS, marketplace, e-commerce, AI/ML, fintech, healthcare, and hardware.
- Ensures the validation report prompt is consistent with the v2 scoring engine.

### 3) `src/lib/agents/finance-analyst.ts`

Exports:
- `FINANCE_ANALYST_ROLE` — finance persona/system role fragment used in prompts
- `FINANCIAL_OUTPUT_CONTRACT` — exact markdown contract for financial projections, unit economics, and break-even analysis
- `FINANCIAL_REPAIR_SYSTEM_PROMPT` — system prompt for repairing missing financial report sections

Responsibilities:
- Defines the financial analyst persona used in validation reports.
- Specifies exact output formatting requirements for financial sections.
- Enforces internal consistency checks and parser-dependent markdown structure.
- Supplies a repair prompt for missing financial sections in partial reports.

### 4) `src/lib/agents/finance-enrichment.ts`

Exports:
- `FINANCE_PASS_SYSTEM_PROMPT` — system prompt for the second-pass finance rewrite
- `buildFinancePassUserPrompt(setup, report)` — builds a user prompt for financial section rewriting
- `mergeFinancialSectionsIntoReport(report, financeBlock)` — replaces or inserts financial sections in an existing report
- `financialChartsUnderSpecified(report)` — checks whether financial dashboard data is underspecified or invalid
- `runFinanceEnrichmentPass(openai, setup, report, seed)` — runs the OpenAI finance repair pass and returns the merged report

Responsibilities:
- Performs a second-pass finance enrichment for generated validation reports.
- Uses the finance analyst persona to rewrite or repair financial markdown.
- Ensures only financial sections are replaced, preserving the rest of the report.
- Detects inadequate financial outputs and triggers repair when charts/data are missing.
- Integrates directly with OpenAI chat completion to generate corrected finance blocks.

### 5) `src/lib/agents/build-validation-report-prompt.ts`

Exports:
- `buildValidationReportPrompt(setup)` — builds the complete prompt for startup validation report generation

Responsibilities:
- Combines scoring rubric, finance persona, industry context, and idea setup into one complete prompt.
- Defines the exact report structure and section headers required by the parser.
- Ensures the prompt includes mandatory sections such as Idea Summary, Research Notes, category scores, financial tables, Go/No-Go recommendation, Lean Canvas, and more.
- Used by `src/app/api/debate/route.ts` when generating a full validation report.

### 6) `src/lib/agents/validation-repair.ts`

Exports:
- `buildValidationRepairSystemPrompt(missingMarkers)` — chooses and builds a repair system prompt based on missing report sections

Responsibilities:
- Selects the appropriate repair prompt when a validation report is incomplete.
- Uses finance repair prompts when financial sections are missing.
- Uses a generic missing-section repair prompt for other broken or partial outputs.
- Supports model output repair without requiring full report regeneration.

## Integration and usage

Direct integration points:
- `src/app/api/score/route.ts` imports and calls `scoreIdeaV2`.
- `src/app/api/debate/route.ts` imports and uses:
  - `buildValidationReportPrompt`
  - `runFinanceEnrichmentPass`
  - `buildValidationRepairSystemPrompt`
- `src/lib/blind-scorer.ts` imports `scoreIdeaV2` to produce blind scoring results.
- `src/components/score/ScoreCardV2.tsx` imports `IdeaScoreV2` types and displays live web search badge data.

## Notes

- `src/lib/agents/idea-scoring-v2.ts` is the most direct OpenAI-facing agent implementation.
- `src/lib/agents/validation-scoring.ts` and `src/lib/agents/build-validation-report-prompt.ts` are prompt construction layers.
- `src/lib/agents/finance-analyst.ts` and `src/lib/agents/finance-enrichment.ts` are the finance-specific persona, contract, and repair infrastructure.
- `src/lib/agents/validation-repair.ts` is the report repair selector.
- `emergent/lib/agents/idea-scoring-v2.ts` appears to be a duplicate copy of the scoring agent.
