"use client";

/**
 * PDR COMMERCE — the operating system for the company (an AI COO, not a
 * dashboard). `/commerce/command`
 *
 * Design LOCKED: docs/pdr-commerce-design.md v3 — SWISS EDITORIAL LEDGER.
 * Function contract: docs/pdr-commerce-outline.md v2 — capabilities arranged
 * as 11 views, an AI workforce underneath, measured-only data, review-first.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Action, AuditLine, Bar, DIMB, FAINTB, FAULTB, Figure, FigureRow, HAIRB, Heads, INKB, INSETB,
  LIVE, MICRO, MONO, Num, OKB, PAPER, Pick, Row, SANS, Section, Stamp, Thin, WARNB, pad2,
} from "./ledger-ui";

/* ── shapes ────────────────────────────────────────────────────────────── */
type Biz = {
  roster: { slug: string; name: string }[];
  business: { slug: string; code: string; createdAt: string; brand: { name: string; fullName: string; domain: string; oneLiner: string; audience?: string; positioning?: string }; catalog: { sku: string; name: string; price: string; priceValue?: number; availability: string; stock: number; provenance?: Record<string, string>; kind?: string; unit?: string }[]; manifest: { ships?: string; returns?: string }; source: string };
  traffic: { agents: number; humans: number; byAgent: Record<string, number>; byKind: Record<string, number>; byProduct: Record<string, number>; recent: { ts: string; agent: string; kind: string }[] };
  orders: { count: number; revenue: number; byAgent: Record<string, number>; bySku: Record<string, { qty: number; revenue: number }>; daily: { d: string; revenue: number; orders: number }[]; recent: { id: string; ts: string; productName: string; qty: number; price: string; channel: string; agent: string; status: string }[] };
  customers: { email: string; name: string; orders: number; revenue: number; lastTs: string }[];
  activity: { ts: string; worker: string; txt: string; by?: "auto" | "owner" }[];
  finance: {
    revenue: number; cogs: number; grossProfit: number | null; marginPct: number | null;
    expenses: number; expensesByCategory: Record<string, number>; monthlyRecurringCost: number; expenseCount: number;
    netProfit: number | null; cashFlow: { month: string; inflow: number; outflow: number; net: number }[]; runwayNote: string;
    inventoryAtPrice: number; inventoryAtCost: number | null; recurringRevenue: number; oneOffRevenue: number;
    avgOrderValue: number; costsOnFile: number; skuCount: number; costs: Record<string, number>;
    perSku: { sku: string; name: string; price: string; priceValue: number | null; unitCost: number | null; unitMargin: number | null; marginPct: number | null; sold: number; revenue: number; profit: number | null; recurring: boolean }[];
  };
  automations: { count: number; enabled: number; fired: string[]; held: string[]; metrics: Record<string, number | null> };
  brain: { updatedAt: string; counts: Record<string, number>; learned: { k: string; kind: string; txt: string }[]; visual: Record<string, string> | null } | null;
  proposals: { worker: "MARKETING" | "OPERATIONS" | "FINANCE" | "SYSTEM"; severity: "act" | "watch" | "ok"; label: string; action?: "brainlearn" | "brainseed" }[];
};
type Analysis = { ts: string; posture: "GROW" | "HOLD" | "FIX"; headline: string; findings: { signal: string; insight: string }[] };
type BrainRuleFull = { k: string; txt: string; kind: string; src: string; domain?: string };
type StepOutcome = { type: string; ok: boolean; detail: string };
type AutoRun = { ts: string; fired: boolean; held?: boolean; reason: string; steps: StepOutcome[] };
type AutoRule = {
  id: string; enabled: boolean;
  if: { metric: string; op: string; value: number };
  then: { type: string; qty?: number; pct?: number; sku?: string; note?: string }[];
  requireApproval?: boolean; lastFired?: string;
  pending?: { ts: string; reason: string; plan: string[] };
  runs?: AutoRun[];
};
type AutoPreview = { id: string; would: boolean; reason: string; condition: string; plan: string[]; requireApproval: boolean };

/** Metric vocabulary, mirrored from METRIC_META in automationRepo so the
    builder reads in the owner's language and shows what is measurable now. */
const AUTO_METRICS: { key: string; label: string; unit: string }[] = [
  { key: "min_stock", label: "lowest stock level", unit: "units" },
  { key: "days_of_stock", label: "days of stock left", unit: "days" },
  { key: "pending_orders", label: "orders awaiting confirmation", unit: "orders" },
  { key: "revenue", label: "total revenue", unit: "€" },
  { key: "margin_pct", label: "gross margin", unit: "%" },
  { key: "net_profit", label: "net profit", unit: "€" },
  { key: "cash_flow_month", label: "this month's cash flow", unit: "€" },
  { key: "agent_reads", label: "agent reads", unit: "reads" },
  { key: "agent_order_rate", label: "agent order rate", unit: "/100 reads" },
];
const AUTO_STEPS: { key: string; label: string }[] = [
  { key: "alert", label: "Raise alert" },
  { key: "restock_low", label: "Restock low +12" },
  { key: "flag_stock_out", label: "Flag sold out" },
  { key: "price_adjust_all", label: "All prices +3%" },
  { key: "pause_campaigns", label: "Pause live campaigns" },
];
type Variant = { id: string; platform: string; angle: string; body: string; createdAt: string; impressions: number | null; clicks: number | null; spend: number | null; orders: number | null; winner?: boolean; retiredAt?: string };
type Campaign = { id: string; name: string; objective: string; channels: string[]; budgetCap: number | null; status: string; createdAt: string; variants: Variant[]; fatigued?: string[] };
type Landing = { id: string; headline: string; subhead: string; bullets: string[]; cta: string; sku: string | null; audience: string | null; campaignId: string | null; createdAt: string; views: number };
type Report = { score: number; checks: { k: string; label: string; status: "PASS" | "WARN" | "FAIL"; note: string }[] };

const POSTURE_C: Record<Analysis["posture"], string> = { GROW: OKB, HOLD: LIVE, FIX: WARNB };
/** Campaign lifecycle, mirrored client-side for the action buttons. */
const CAMPAIGN_NEXT: Record<string, string[]> = { draft: ["live", "ended"], live: ["paused", "ended"], paused: ["live", "ended"], ended: [] };
const CAMPAIGN_C: Record<string, string> = { draft: DIMB, live: OKB, paused: WARNB, ended: FAINTB };
const FLOW_NEXT: Record<string, string[]> = { received: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };
const STATUS_C: Record<string, string> = { received: WARNB, confirmed: LIVE, shipped: LIVE, delivered: OKB, cancelled: FAULTB };
const WORKER_C: Record<string, string> = { MARKETING: LIVE, OPERATIONS: OKB, FINANCE: INKB, SYSTEM: DIMB, ORDER: OKB, AGENT: LIVE, VISITOR: FAINTB };

const VIEWS = [
  "DASHBOARD", "MARKETING", "SOCIAL", "OPERATIONS", "FINANCE", "AI COMMERCE",
  "PRODUCTS", "CUSTOMERS", "BRAIN", "AUTOMATION", "EVENTS", "SETTINGS",
] as const;
type View = (typeof VIEWS)[number];
/** Sidebar labels — sentence case, with acronyms preserved. */
const NAV_LABEL: Record<View, string> = {
  DASHBOARD: "Dashboard", MARKETING: "Marketing", SOCIAL: "Social", OPERATIONS: "Operations",
  FINANCE: "Finance", "AI COMMERCE": "AI commerce", PRODUCTS: "Products", CUSTOMERS: "Customers",
  BRAIN: "Business brain", AUTOMATION: "Automation", EVENTS: "Events", SETTINGS: "Settings",
};
const TITLES: Record<View, string> = {
  DASHBOARD: "The business at a glance",
  MARKETING: "Autonomous marketing",
  SOCIAL: "Social presence",
  OPERATIONS: "Operations & fulfilment",
  FINANCE: "Financial intelligence",
  "AI COMMERCE": "AI commerce",
  PRODUCTS: "Product intelligence",
  CUSTOMERS: "Customers",
  BRAIN: "Business brain",
  AUTOMATION: "Automation",
  EVENTS: "Events",
  SETTINGS: "Settings",
};

export default function CommerceLedger() {
  const [biz, setBiz] = useState<Biz | null>(null);
  const [empty, setEmpty] = useState(false);
  const [view, setView] = useState<View>("DASHBOARD");
  const [slug, setSlug] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [draftPf, setDraftPf] = useState("LINKEDIN");
  const [draft, setDraft] = useState<string | null>(null);
  const [brainFull, setBrainFull] = useState<{ rules: BrainRuleFull[]; visual: Record<string, string> | null } | null>(null);
  const [teachTxt, setTeachTxt] = useState("");
  const [teachDomain, setTeachDomain] = useState<"copy" | "video">("copy");
  const [autos, setAutos] = useState<AutoRule[] | null>(null);
  const [autoMetric, setAutoMetric] = useState("min_stock");
  const [autoOp, setAutoOp] = useState("<");
  const [autoVal, setAutoVal] = useState("5");
  const [autoActs, setAutoActs] = useState<string[]>(["alert"]);
  const [autoHold, setAutoHold] = useState(false);
  const [preview, setPreview] = useState<AutoPreview[] | null>(null);
  const [metricNow, setMetricNow] = useState<Record<string, number | null> | null>(null);
  const [openRule, setOpenRule] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [ships, setShips] = useState("");
  const [returns, setReturns] = useState("");
  const [costDraft, setCostDraft] = useState<Record<string, string>>({});
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [landings, setLandings] = useState<Landing[] | null>(null);
  const [cName, setCName] = useState("");
  const [cObjective, setCObjective] = useState("");
  const [cChannels, setCChannels] = useState<string[]>(["INSTAGRAM"]);
  const [cBudget, setCBudget] = useState("");
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<{ id: string; date: string; label: string; amount: number; category: string; recurring: boolean }[] | null>(null);
  const [exLabel, setExLabel] = useState("");
  const [exAmount, setExAmount] = useState("");
  const [exCategory, setExCategory] = useState("materials");
  const [exRecurring, setExRecurring] = useState(false);
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pStock, setPStock] = useState("24");
  const [pKind, setPKind] = useState("good");
  const [pUnit, setPUnit] = useState("item");
  const [openSku, setOpenSku] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [ePrice, setEPrice] = useState("");
  const [eStock, setEStock] = useState("");
  const [eKind, setEKind] = useState("good");
  const [eUnit, setEUnit] = useState("item");
  const [prov, setProv] = useState<Record<string, string>>({});
  const slugRef = useRef(slug);
  slugRef.current = slug;

  const pull = useCallback((s?: string | null) => {
    fetch(`/api/commerce/business${s ? `?slug=${s}` : ""}`)
      .then((r) => r.json())
      .then((d) => { if (d?.ok) { setBiz(d); setSlug(d.business.slug); setEmpty(false); } else setEmpty(true); })
      .catch(() => {});
  }, []);
  useEffect(() => { pull(null); }, [pull]);
  useEffect(() => {
    const poll = setInterval(() => pull(slugRef.current), 10000);
    return () => clearInterval(poll);
  }, [pull]);

  const bslug = biz?.business.slug ?? null;
  const bcode = biz?.business.code ?? null;
  useEffect(() => {
    if (!bslug || !biz) return;
    let alive = true;
    setAnalysis(null); setDraft(null); setBrainFull(null); setAutos(null); setReport(null); setOrderFilter("all");
    setCampaigns(null); setLandings(null); setOpenCampaign(null); setExpenses(null);
    setPreview(null); setMetricNow(null); setOpenRule(null); setOpenSku(null);
    setShips(biz.business.manifest.ships ?? ""); setReturns(biz.business.manifest.returns ?? "");
    setCostDraft(Object.fromEntries(biz.business.catalog.map((p) => [p.sku, biz.finance.costs[p.sku] != null ? String(biz.finance.costs[p.sku]) : ""])));
    fetch(`/api/commerce/analyse?slug=${bslug}`).then((r) => r.json()).then((d) => { if (alive && d?.ok) setAnalysis(d.analysis); }).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on company switch only
  }, [bslug]);
  useEffect(() => {
    if (view !== "BRAIN" || !bcode || brainFull) return;
    let alive = true;
    fetch(`/api/studio/brain?code=${bcode}`).then((r) => r.json())
      .then((d) => { if (alive && d?.ok) setBrainFull({ rules: d.brain.rules, visual: d.brain.visual ?? null }); }).catch(() => {});
    return () => { alive = false; };
  }, [view, bcode, brainFull]);
  useEffect(() => {
    if (view !== "AUTOMATION" || !bslug || autos) return;
    let alive = true;
    fetch(`/api/commerce/automations?slug=${bslug}`).then((r) => r.json())
      .then((d) => { if (alive && d?.ok) setAutos(d.rules); }).catch(() => {});
    return () => { alive = false; };
  }, [view, bslug, autos]);
  // Finance view owns the expense ledger.
  useEffect(() => {
    if (view !== "FINANCE" || !bslug || expenses) return;
    let alive = true;
    fetch(`/api/commerce/expenses?slug=${bslug}`).then((r) => r.json())
      .then((d) => { if (alive && d?.ok) setExpenses(d.expenses); }).catch(() => {});
    return () => { alive = false; };
  }, [view, bslug, expenses]);
  // Marketing view owns campaigns + landing pages.
  useEffect(() => {
    if (view !== "MARKETING" || !bslug) return;
    let alive = true;
    if (!campaigns) fetch(`/api/commerce/campaigns?slug=${bslug}`).then((r) => r.json()).then((d) => { if (alive && d?.ok) setCampaigns(d.campaigns); }).catch(() => {});
    if (!landings) fetch(`/api/commerce/landing?slug=${bslug}`).then((r) => r.json()).then((d) => { if (alive && d?.ok) setLandings(d.landings); }).catch(() => {});
    return () => { alive = false; };
  }, [view, bslug, campaigns, landings]);

  const act = async (key: string, fn: () => Promise<string | null>) => {
    if (busy) return;
    setBusy(key); setNotice(null);
    try { setNotice(await fn()); } catch { setNotice("Action failed"); }
    setBusy(null);
    pull(slugRef.current);
  };
  const analyseNow = () => act("analyse", async () => {
    const r = await fetch("/api/commerce/analyse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug }) });
    const d = await r.json();
    if (d?.ok) { setAnalysis(d.analysis); return "Situation updated"; }
    return String(d?.error ?? "analysis failed");
  });
  const execute = (action: "brainlearn" | "brainseed") => act(action, async () => {
    const b = biz!.business;
    const r = action === "brainlearn"
      ? await fetch("/api/studio/brainlearn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: b.code, slug: b.slug }) })
      : await fetch("/api/studio/brainseed", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: b.slug, kit: { projectCode: b.code, fullName: b.brand.fullName, descriptor: b.brand.oneLiner, oneLiner: b.brand.oneLiner, brandKit: { audience: b.brand.audience, positioning: b.brand.positioning } } }) });
    const d = await r.json();
    setBrainFull(null);
    return d?.ok ? "Executed — brain updated" : String(d?.error ?? "failed");
  });
  const advanceOrder = (id: string, status: string) => act(`o-${id}`, async () => {
    const r = await fetch("/api/commerce/orderflow", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, id, status }) });
    const d = await r.json();
    return d?.ok ? `Order → ${status}` : String(d?.error ?? "refused");
  });
  const restock = (sku: string) => act(`r-${sku}`, async () => {
    const r = await fetch("/api/commerce/restock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, sku, qty: 12 }) });
    const d = await r.json();
    return d?.ok ? `Restocked ${sku} → ${d.stock} units` : String(d?.error ?? "failed");
  });
  const generateDraft = (platform: string) => act(`draft-${platform}`, async () => {
    const b = biz!.business;
    const r = await fetch("/api/studio/copy", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ kit: { projectCode: b.code, fullName: b.brand.fullName, descriptor: b.brand.oneLiner, oneLiner: b.brand.oneLiner, brandKit: { audience: b.brand.audience, positioning: b.brand.positioning } }, platform, angle: "OFFER", slug: b.slug }),
    });
    const d = await r.json();
    if (d?.ok && d.body) { setDraft(d.body); setDraftPf(platform); return `Draft written — ${d.rulesApplied} brain rules applied`; }
    return String(d?.error ?? "draft failed");
  });
  const teach = (kind: "do" | "dont") => act("teach", async () => {
    const r = await fetch("/api/studio/brain", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: bcode, add: { kind, txt: teachTxt, domain: teachDomain } }) });
    const d = await r.json();
    if (d?.ok) { setBrainFull({ rules: d.brain.rules, visual: d.brain.visual ?? null }); setTeachTxt(""); return "Rule taught"; }
    return "Teach failed";
  });
  const forgetRule = (k: string) => act(`f-${k}`, async () => {
    const r = await fetch("/api/studio/brain", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: bcode, remove: k }) });
    const d = await r.json();
    if (d?.ok) { setBrainFull({ rules: d.brain.rules, visual: d.brain.visual ?? null }); return `Rule ${k} removed`; }
    return "Remove failed";
  });
  const addAuto = () => act("auto", async () => {
    // Steps carry their own bounded parameters — the plan stored is the plan run.
    const then = autoActs.map((t) => t === "restock_low" ? { type: t, qty: 12 } : t === "price_adjust_all" ? { type: t, pct: 3 } : { type: t });
    const r = await fetch("/api/commerce/automations", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, if: { metric: autoMetric, op: autoOp, value: Number(autoVal) }, then, requireApproval: autoHold }),
    });
    const d = await r.json();
    if (d?.ok) { setAutos(d.rules); setPreview(null); return `Automation armed — ${then.length} step(s)${autoHold ? ", holds for approval" : ""}`; }
    return String(d?.error ?? "failed");
  });
  const dryRun = () => act("dry", async () => {
    const r = await fetch(`/api/commerce/automations?slug=${bslug}&preview=1`);
    const d = await r.json();
    if (d?.ok) {
      setAutos(d.rules); setPreview(d.preview); setMetricNow(d.metrics);
      const n = (d.preview as AutoPreview[]).filter((p) => p.would).length;
      return n ? `${n} rule(s) would fire now` : "No rule would fire on current numbers";
    }
    return String(d?.error ?? "dry run failed");
  });
  const ruleOp = (id: string, op: "toggle" | "approve" | "dismiss") => act(`t-${id}`, async () => {
    const r = await fetch("/api/commerce/automations", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, id, op }) });
    const d = await r.json();
    if (!d?.ok) return `${op} failed`;
    setAutos(d.rules);
    if (op !== "toggle") pull(slugRef.current);   // an approved plan changes the business
    return op === "approve" ? `${id} plan executed` : op === "dismiss" ? `${id} plan declined` : null;
  });
  const toggleAuto = (id: string) => ruleOp(id, "toggle");
  const deleteAuto = (id: string) => act(`d-${id}`, async () => {
    const r = await fetch("/api/commerce/automations", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, id }) });
    const d = await r.json();
    if (d?.ok) { setAutos(d.rules); return `${id} removed`; }
    return "Remove failed";
  });
  const runReadiness = () => act("report", async () => {
    const r = await fetch(`/api/store/${bslug}/report`);
    const d = await r.json();
    if (d?.ok) { setReport(d); return `Readiness ${d.score}/100`; }
    return "Readiness check failed";
  });
  const saveSettings = () => act("settings", async () => {
    const r = await fetch("/api/commerce/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, ships, returns }) });
    const d = await r.json();
    return d?.ok ? "Saved — storefront and JSON-LD updated" : "Save failed";
  });
  /* ── campaigns & landing pages (autonomous marketing) ── */
  const createCampaign = () => act("campaign", async () => {
    const r = await fetch("/api/commerce/campaigns", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, name: cName, objective: cObjective, channels: cChannels, budgetCap: Number(cBudget) || null }),
    });
    const d = await r.json();
    if (d?.ok) { setCampaigns(null); setCName(""); setCObjective(""); setCBudget(""); return `Campaign ${d.campaign.id} drafted`; }
    return String(d?.error ?? "failed");
  });
  const writeVariant = (id: string, platform: string) => act(`v-${id}-${platform}`, async () => {
    const r = await fetch("/api/commerce/campaigns", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, id, action: "variant", platform }),
    });
    const d = await r.json();
    if (d?.ok) { setCampaigns(null); setOpenCampaign(id); return `Variant written — ${d.rulesApplied} brain rules applied`; }
    return String(d?.error ?? "failed");
  });
  const campaignStatus = (id: string, status: string) => act(`cs-${id}`, async () => {
    const r = await fetch("/api/commerce/campaigns", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, id, status }) });
    const d = await r.json();
    if (d?.ok) { setCampaigns(null); return `Campaign → ${status}`; }
    return String(d?.error ?? "refused");
  });
  const variantAction = (id: string, variantId: string, kind: "winner" | "retire") => act(`va-${variantId}`, async () => {
    const r = await fetch("/api/commerce/campaigns", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, id, variantId, [kind]: true }),
    });
    const d = await r.json();
    if (d?.ok) { setCampaigns(null); return kind === "winner" ? `${variantId} marked winner` : `${variantId} retired`; }
    return String(d?.error ?? "failed");
  });
  const writeLanding = (sku: string | null, campaignId: string | null) => act("landing", async () => {
    const r = await fetch("/api/commerce/landing", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, sku, campaignId }),
    });
    const d = await r.json();
    if (d?.ok) { setLandings(null); return `Landing ${d.landing.id} written — ${d.rulesApplied} brain rules applied`; }
    return String(d?.error ?? "failed");
  });
  const removeLanding = (id: string) => act(`dl-${id}`, async () => {
    const r = await fetch("/api/commerce/landing", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, id }) });
    const d = await r.json();
    if (d?.ok) { setLandings(d.landings); return `${id} removed`; }
    return "Remove failed";
  });

  const addExpense = () => act("expense", async () => {
    const r = await fetch("/api/commerce/expenses", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, label: exLabel, amount: Number(exAmount), category: exCategory, recurring: exRecurring }),
    });
    const d = await r.json();
    if (d?.ok) { setExpenses(d.expenses); setExLabel(""); setExAmount(""); return `${d.expense.id} recorded`; }
    return String(d?.error ?? "failed");
  });
  const removeExpense = (id: string) => act(`ex-${id}`, async () => {
    const r = await fetch("/api/commerce/expenses", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, id }) });
    const d = await r.json();
    if (d?.ok) { setExpenses(d.expenses); return `${id} removed`; }
    return "Remove failed";
  });

  /* ── website management: the catalog behind the live store ────────────── */
  const addProduct = () => act("addp", async () => {
    const r = await fetch("/api/commerce/products", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, name: pName, description: pDesc, price: pPrice, category: pCategory, stock: Number(pStock), kind: pKind, unit: pUnit }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? "publish failed");
    setPName(""); setPPrice(""); setPDesc(""); setPCategory(""); setPStock("24"); setPKind("good"); setPUnit("item");
    pull(slugRef.current);
    return `Published — ${d.detail}`;
  });
  const saveProduct = (sku: string) => act(`up-${sku}`, async () => {
    const r = await fetch("/api/commerce/products", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, sku, op: "update", price: ePrice, stock: Number(eStock), kind: eKind, unit: eUnit }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? "update failed");
    pull(slugRef.current);
    return `${sku}: ${d.detail}`;
  });
  const saveProvenance = (sku: string) => act(`pv-${sku}`, async () => {
    // Send every field, blanks included — a cleared field must un-claim itself.
    const provenance = Object.fromEntries(
      ["material", "origin", "madeBy", "leadTime", "care", "warranty", "weight", "dimensions"].map((k) => [k, prov[k] ?? ""]),
    );
    const r = await fetch("/api/commerce/products", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, sku, op: "update", provenance }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? "nothing to change");
    pull(slugRef.current);
    return `${sku}: ${d.detail}`;
  });
  const setProductAvailability = (sku: string, availability: string) => act(`up-${sku}`, async () => {
    const r = await fetch("/api/commerce/products", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, sku, op: "update", availability }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? "update failed");
    pull(slugRef.current);
    return `${sku}: ${d.detail}`;
  });
  const productOp = (sku: string, op: "retire" | "restore") => act(`up-${sku}`, async () => {
    const r = await fetch("/api/commerce/products", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, sku, op }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? `${op} failed`);
    pull(slugRef.current);
    return d.detail;
  });

  const saveCosts = () => act("costs", async () => {
    const costs: Record<string, number> = {};
    for (const [sku, v] of Object.entries(costDraft)) { const n = Number(v); if (v !== "" && Number.isFinite(n) && n >= 0) costs[sku] = n; }
    const r = await fetch("/api/commerce/costs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: bslug, costs }) });
    const d = await r.json();
    return d?.ok ? `Costs saved for ${Object.keys(d.costs).length} SKUs — margin now computed` : "Save failed";
  });

  /* ── derived ──────────────────────────────────────────────────────────── */
  const alerts = biz ? biz.proposals.filter((p) => p.severity === "act").length : 0;
  const dayN = biz ? Math.max(1, Math.ceil((Date.now() - Date.parse(biz.business.createdAt)) / 86400000)) : 1;
  const pending = biz ? biz.orders.recent.filter((o) => o.status === "received").length : 0;
  const lowStock = biz ? biz.business.catalog.filter((p) => p.stock <= 3 && p.availability !== "PreOrder").length : 0;
  const agentOrders = biz ? Object.values(biz.orders.byAgent).reduce((a, n) => a + n, 0) : 0;
  const badge: Partial<Record<View, number>> = biz ? {
    MARKETING: biz.proposals.filter((p) => p.worker === "MARKETING" && p.severity !== "ok").length,
    OPERATIONS: pending + lowStock,
    FINANCE: biz.proposals.filter((p) => p.worker === "FINANCE" && p.severity !== "ok").length,
    AUTOMATION: biz.automations.fired.length + biz.automations.held.length,
  } : {};
  const filteredOrders = biz ? biz.orders.recent.filter((o) => orderFilter === "all" || o.status === orderFilter) : [];
  const maxDay = biz ? Math.max(...biz.orders.daily.map((d) => d.revenue), 1) : 1;
  const maxAgent = biz ? Math.max(...Object.values(biz.traffic.byAgent), 1) : 1;
  const ledger = biz
    ? [
        ...biz.activity.map((a) => ({ ts: a.ts, tag: a.worker, txt: a.txt, by: a.by })),
        ...biz.traffic.recent.map((h) => ({ ts: h.ts, tag: h.agent === "HUMAN" ? "VISITOR" : "AGENT", txt: `${h.agent} read ${h.kind}` })),
        ...biz.orders.recent.map((o) => ({ ts: o.ts, tag: "ORDER", txt: `${o.productName} ×${o.qty} · ${o.price} · ${o.channel === "agent-json" ? o.agent : "web"}` })),
      ].sort((a, b) => b.ts.localeCompare(a.ts))
    : [];
  const proposalsFor = (w: string) => biz?.proposals.filter((p) => p.worker === w) ?? [];

  /* ── worker queue block, reused across views ──────────────────────────── */
  const Queue = ({ worker }: { worker: "MARKETING" | "OPERATIONS" | "FINANCE" }) => {
    const items = proposalsFor(worker);
    return (
      <div>
        {items.length === 0 && <Thin>No findings this cycle — the {worker.toLowerCase()} worker is observing.</Thin>}
        {items.map((p, i) => (
          <Row key={i} warn={p.severity === "act"}>
            <Stamp text={p.severity} color={p.severity === "act" ? WARNB : p.severity === "watch" ? LIVE : OKB} />
            <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{p.label}</span>
            {p.action && <Action onClick={() => execute(p.action!)} disabled={!!busy}>{busy === p.action ? "…" : "EXECUTE →"}</Action>}
          </Row>
        ))}
      </div>
    );
  };

  if (empty) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6" style={{ backgroundColor: PAPER, fontFamily: SANS }}>
        <div className="max-w-[460px]">
          <div style={{ height: 2, backgroundColor: INKB }} />
          <div className="pt-3" style={MICRO}>PDR COMMERCE · THE OPERATING SYSTEM</div>
          <h1 className="mt-3 text-balance font-display text-[2.4rem] uppercase leading-[0.95]" style={{ color: INKB }}>No company under management</h1>
          <p className="mt-3 text-pretty text-[13.5px] leading-relaxed" style={{ color: DIMB }}>
            Studio manufactures the business; Commerce operates it. Fabricate a storefront and it opens here as a ledger.
          </p>
          <a href="/studio" className="mt-6 inline-block px-5 py-3 text-[12px] font-semibold no-underline" style={{ backgroundColor: INKB, color: PAPER }}>OPEN THE STUDIO →</a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh" style={{ backgroundColor: PAPER, color: INKB, fontFamily: SANS }}>
      {/* ── SIDEBAR — the colophon ── */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-[230px] flex-col overflow-y-auto md:flex" style={{ borderRight: `1px solid ${HAIRB}`, backgroundColor: PAPER }}>
        <div className="px-5 pb-4 pt-5">
          <div className="font-display text-[1.35rem] uppercase leading-none">PDR</div>
          <div className="mt-1 text-[13px] font-semibold" style={{ color: LIVE }}>Commerce</div>
          <div className="mt-1.5" style={MICRO}>THE OPERATING SYSTEM</div>
        </div>
        <div className="px-5 pb-4">
          <div style={{ height: 2, backgroundColor: INKB }} />
          <div className="pt-2" style={MICRO}>REGISTER</div>
          <div className="mt-1.5 flex max-h-[128px] flex-col overflow-auto">
            {biz?.roster.map((r) => (
              <button key={r.slug} onClick={() => { setSlug(r.slug); pull(r.slug); setView("DASHBOARD"); }}
                className="py-1 text-left text-[12.5px] font-medium"
                style={{ color: r.slug === bslug ? LIVE : DIMB, borderBottom: `1px solid ${HAIRB}` }}>
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <nav className="px-5">
          <div style={{ height: 2, backgroundColor: INKB }} />
          {VIEWS.map((v, i) => (
            <button key={v} onClick={() => setView(v)} className="flex w-full items-baseline gap-2.5 py-[7px] text-left"
              style={{ borderBottom: `1px solid ${HAIRB}` }}>
              <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", color: view === v ? LIVE : FAINTB }}>{pad2(i + 1)}</span>
              <span className="text-[12.5px]" style={{ color: view === v ? INKB : DIMB, fontWeight: view === v ? 700 : 400 }}>
                {NAV_LABEL[v]}
              </span>
              {(badge[v] ?? 0) > 0 && <span className="ml-auto"><Stamp text={String(badge[v])} color={WARNB} filled /></span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-5 py-5">
          <div style={MICRO}>DAY {pad2(dayN)} OF OPERATION</div>
          {biz && <a href={`/store/${biz.business.slug}`} target="_blank" rel="noreferrer" className="mt-1.5 block text-[12px] font-medium no-underline" style={{ color: LIVE }}>Live store ↗</a>}
          <a href="/commerce/statement" className="mt-0.5 block text-[12px] font-medium no-underline" style={{ color: LIVE }}>Operator statement ↗</a>
          <a href="/studio" className="mt-0.5 block text-[12px] no-underline" style={{ color: FAINTB }}>Studio ↗</a>
        </div>
      </aside>

      {/* ── LEDGER PAGE ── */}
      <div className="min-w-0 flex-1 md:ml-[230px]">
        {/* Mobile chrome: the same colophon, folded. Same paper, same rules —
            a narrow screen gets the OS, not a cut-down version of it. */}
        <div className="sticky top-0 z-20 md:hidden" style={{ backgroundColor: PAPER, borderBottom: `2px solid ${INKB}` }}>
          <div className="flex items-center gap-3 px-5 py-3">
            <span className="font-display text-[1.1rem] uppercase leading-none">PDR</span>
            <span className="text-[12px] font-semibold" style={{ color: LIVE }}>Commerce</span>
            <span className="ml-auto flex items-center gap-2">
              {alerts > 0 && <Stamp text={String(alerts)} color={WARNB} filled />}
              <Pick onClick={() => setNavOpen(!navOpen)} active={navOpen}>{navOpen ? "Close" : `${pad2(VIEWS.indexOf(view) + 1)} ${NAV_LABEL[view]}`}</Pick>
            </span>
          </div>
          {navOpen && (
            <div className="max-h-[70dvh] overflow-y-auto px-5 pb-4">
              <div style={MICRO}>REGISTER</div>
              <div className="mb-3 mt-1 flex flex-wrap gap-1.5">
                {biz?.roster.map((r) => (
                  <Pick key={r.slug} active={r.slug === bslug}
                    onClick={() => { setSlug(r.slug); pull(r.slug); setView("DASHBOARD"); setNavOpen(false); }}>
                    {r.name}
                  </Pick>
                ))}
              </div>
              <div style={{ height: 2, backgroundColor: INKB }} />
              {VIEWS.map((v, i) => (
                <button key={v} onClick={() => { setView(v); setNavOpen(false); }}
                  className="flex w-full items-baseline gap-2.5 py-2.5 text-left" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                  <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", color: view === v ? LIVE : FAINTB }}>{pad2(i + 1)}</span>
                  <span className="text-[13.5px]" style={{ color: view === v ? INKB : DIMB, fontWeight: view === v ? 700 : 400 }}>{NAV_LABEL[v]}</span>
                  {(badge[v] ?? 0) > 0 && <span className="ml-auto"><Stamp text={String(badge[v])} color={WARNB} filled /></span>}
                </button>
              ))}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-3">
                {biz && <a href={`/store/${biz.business.slug}`} target="_blank" rel="noreferrer" className="text-[12px] font-medium no-underline" style={{ color: LIVE }}>Live store ↗</a>}
                <a href="/commerce/statement" className="text-[12px] font-medium no-underline" style={{ color: LIVE }}>Operator statement ↗</a>
                <a href="/studio" className="text-[12px] no-underline" style={{ color: FAINTB }}>Studio ↗</a>
              </div>
            </div>
          )}
        </div>
        {biz ? (
          <div className="mx-auto max-w-[1040px] px-5 pb-24 sm:px-6">
            {/* masthead */}
            <header className="pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div>
                  <div style={MICRO}>{biz.business.brand.fullName} · {biz.business.brand.domain}</div>
                  <h1 className="mt-1.5 text-balance font-display text-[clamp(1.8rem,4vw,2.6rem)] uppercase leading-[0.95]">{TITLES[view]}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {alerts > 0 && <Stamp text={`${alerts} awaiting review`} color={WARNB} />}
                  {biz.automations.fired.length > 0 && <Stamp text={`automation fired · ${biz.automations.fired.join(", ")}`} color={LIVE} />}
                  {notice && <span className="text-[12px] font-semibold" style={{ color: /fail|refused|not enough/i.test(notice) ? FAULTB : OKB }}>{notice}</span>}
                </div>
              </div>
            </header>

            {/* ══════════ 01 DASHBOARD ══════════ */}
            {view === "DASHBOARD" && (
              <>
                <Section n={1} title="Situation" right={<Action onClick={analyseNow} disabled={!!busy}>{busy === "analyse" ? "READING…" : "◉ ANALYSE"}</Action>}>
                  {analysis ? (
                    <>
                      <div className="flex flex-wrap items-baseline gap-3 pb-2">
                        <Stamp text={analysis.posture} color={POSTURE_C[analysis.posture]} filled />
                        <span className="min-w-0 flex-1 text-pretty text-[16px] font-semibold leading-snug">{analysis.headline}</span>
                        <Num color={FAINTB}>{Math.max(0, Math.round((Date.now() - Date.parse(analysis.ts)) / 60000))}m ago</Num>
                      </div>
                      {analysis.findings.map((f, i) => (
                        <Row key={i}>
                          <span className="min-w-0 flex-1 text-pretty text-[13px]">
                            <span className="font-semibold" style={{ color: LIVE }}>{f.signal}</span>
                            <span style={{ color: FAINTB }}> — </span>
                            <span style={{ color: DIMB }}>{f.insight}</span>
                          </span>
                        </Row>
                      ))}
                    </>
                  ) : <Thin>No situational read on file. Run one — Claude reads the whole business record and cites its numbers.</Thin>}
                </Section>

                <Section n={2} title="The figures">
                  <FigureRow>
                    <Figure label="REVENUE RECEIVED" value={`€${biz.finance.revenue.toLocaleString("en-US")}`} color={OKB} note={`avg order €${biz.finance.avgOrderValue}`} />
                    <Figure label="ORDERS" value={biz.orders.count} note={`${pending} awaiting confirmation`} />
                    <Figure label="CUSTOMERS" value={biz.customers.length} note={`${biz.customers.filter((c) => c.orders > 1).length} repeat`} />
                    <Figure label="AGENT READS" value={biz.traffic.agents} color={LIVE} note={`${biz.traffic.humans} human`} />
                    <Figure label="STOCK UNITS" value={biz.business.catalog.reduce((a, p) => a + (p.stock ?? 0), 0)} note={`€${biz.finance.inventoryAtPrice} at price`} />
                    <Figure label="AUTOMATIONS" value={`${biz.automations.enabled}/${biz.automations.count}`} color={LIVE} note="armed / total" />
                  </FigureRow>
                </Section>

                <Section n={3} title="Revenue by day" right={<span style={MICRO}>MEASURED FROM ORDERS</span>}>
                  {biz.orders.daily.length === 0 ? <Thin>No orders yet — this chart draws only real orders, never a placeholder curve.</Thin> : (
                    <div className="flex items-end gap-4 px-1 py-4" style={{ height: 150, backgroundColor: INSETB }}>
                      {biz.orders.daily.map((d) => (
                        <div key={d.d} className="flex flex-1 flex-col items-center justify-end gap-1.5" title={`${d.d} · €${d.revenue} · ${d.orders} orders`}>
                          <Num color={OKB} bold>€{d.revenue}</Num>
                          <div className="w-full max-w-[52px]" style={{ height: Math.max(4, (d.revenue / maxDay) * 92), backgroundColor: OKB }} />
                          <Num color={FAINTB}>{d.d.slice(5)}</Num>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section n={4} title="Awaiting your review" right={<span style={MICRO}>THE WORKFORCE PROPOSES · YOU APPROVE</span>}>
                  {biz.proposals.filter((p) => p.severity !== "ok").length === 0 && <Thin>Nothing pending — every worker reports nominal.</Thin>}
                  {biz.proposals.filter((p) => p.severity !== "ok").map((p, i) => (
                    <Row key={i} warn={p.severity === "act"}>
                      <Stamp text={p.worker} color={WORKER_C[p.worker]} />
                      <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{p.label}</span>
                      {p.action && <Action onClick={() => execute(p.action!)} disabled={!!busy}>{busy === p.action ? "…" : "EXECUTE →"}</Action>}
                    </Row>
                  ))}
                </Section>
                <AuditLine measured="orders · revenue · customers · agent reads · stock · automations" awaiting="ad accounts · payment rails" />
              </>
            )}

            {/* ══════════ 02 MARKETING ══════════ */}
            {view === "MARKETING" && (
              <>
                <Section n={1} title="Marketing worker" right={<Stamp text="marketing" color={LIVE} />}>
                  <Queue worker="MARKETING" />
                </Section>

                {/* campaigns — durable objects with creative experiments */}
                <Section n={2} title="Campaigns" right={<span style={MICRO}>{campaigns ? `${campaigns.length} ON FILE · ${campaigns.filter((c) => c.status === "live").length} LIVE` : "LOADING…"}</span>}>
                  {/* create */}
                  <div className="flex flex-wrap items-center gap-2 py-3">
                    <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Campaign name"
                      className="h-9 w-[180px] px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <input value={cObjective} onChange={(e) => setCObjective(e.target.value)} placeholder="Objective — e.g. sell 40 sets before December"
                      className="h-9 min-w-[240px] flex-1 px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <span className="flex flex-wrap gap-1.5">
                      {["INSTAGRAM", "LINKEDIN", "TIKTOK", "X", "META", "EMAIL"].map((ch) => (
                        <Pick key={ch} onClick={() => setCChannels((s) => s.includes(ch) ? s.filter((x) => x !== ch) : [...s, ch])} active={cChannels.includes(ch)}>
                          {ch.charAt(0) + ch.slice(1).toLowerCase()}
                        </Pick>
                      ))}
                    </span>
                    <input value={cBudget} onChange={(e) => setCBudget(e.target.value)} placeholder="cap €/mo"
                      className="h-9 w-[92px] px-2 text-[13px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <Action onClick={createCampaign} disabled={!!busy || !cName.trim() || !cObjective.trim() || cChannels.length === 0}>
                      {busy === "campaign" ? "DRAFTING…" : "DRAFT CAMPAIGN"}
                    </Action>
                  </div>

                  {campaigns?.length === 0 && <Thin>No campaigns yet. A campaign is a durable objective that owns its creative variants — draft one and the worker writes the creative through the brain.</Thin>}
                  {(campaigns ?? []).map((c) => {
                    const open = openCampaign === c.id;
                    const winner = c.variants.find((v) => v.winner);
                    return (
                      <div key={c.id} style={{ borderBottom: `1px solid ${HAIRB}` }}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 py-3">
                          <Stamp text={c.status} color={CAMPAIGN_C[c.status] ?? DIMB} filled={c.status === "live"} />
                          <button onClick={() => setOpenCampaign(open ? null : c.id)} className="min-w-0 text-left">
                            <span className="text-[13.5px] font-semibold">{c.name}</span>
                            <span className="ml-2 text-[12px]" style={{ color: DIMB }}>{c.objective}</span>
                          </button>
                          <span style={MICRO}>{c.channels.join(" · ")}{c.budgetCap ? ` · CAP €${c.budgetCap}/MO` : ""}</span>
                          <Stamp text={`${c.variants.length} variant${c.variants.length === 1 ? "" : "s"}`} color={c.variants.length ? LIVE : FAINTB} />
                          {winner && <Stamp text="winner picked" color={OKB} />}
                          {(c.fatigued?.length ?? 0) > 0 && <Stamp text={`${c.fatigued!.length} tired`} color={WARNB} />}
                          <span className="ml-auto flex flex-wrap gap-1.5">
                            {(CAMPAIGN_NEXT[c.status] ?? []).map((nx) => (
                              <Pick key={nx} onClick={() => campaignStatus(c.id, nx)} disabled={!!busy} danger={nx === "ended"} active={nx === "live"}>
                                {nx.charAt(0).toUpperCase() + nx.slice(1)}
                              </Pick>
                            ))}
                            <Pick onClick={() => setOpenCampaign(open ? null : c.id)} active={open}>{open ? "Hide" : "Creative"}</Pick>
                          </span>
                        </div>

                        {open && (
                          <div className="px-1 pb-4">
                            <div className="flex flex-wrap items-center gap-2 pb-2">
                              <span style={MICRO}>WRITE A VARIANT</span>
                              {c.channels.map((ch) => (
                                <Pick key={ch} onClick={() => writeVariant(c.id, ch)} disabled={!!busy} active>
                                  {busy === `v-${c.id}-${ch}` ? "…" : `+ ${ch.charAt(0) + ch.slice(1).toLowerCase()}`}
                                </Pick>
                              ))}
                              <Pick onClick={() => writeLanding(null, c.id)} disabled={!!busy}>
                                {busy === "landing" ? "…" : "+ Landing page"}
                              </Pick>
                            </div>
                            {c.variants.length === 0 && <Thin>No creative yet — each variant is written through the brain and told to differ from its siblings.</Thin>}
                            {c.variants.map((v) => (
                              <div key={v.id} className="py-3" style={{ borderTop: `1px solid ${HAIRB}` }}>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                  <Stamp text={v.id} color={v.winner ? OKB : v.retiredAt ? FAINTB : LIVE} filled={!!v.winner} />
                                  <span style={MICRO}>{v.platform} · {v.angle}</span>
                                  {v.retiredAt && <Stamp text="retired" color={FAINTB} />}
                                  {c.fatigued?.includes(v.id) && <Stamp text="fatigue" color={WARNB} />}
                                  <span className="ml-auto flex items-center gap-3">
                                    <span style={MICRO}>
                                      {v.impressions == null ? "NO CHANNEL DATA YET" : `${v.impressions} IMPR · ${v.clicks ?? 0} CLICKS · ${v.orders ?? 0} ORDERS`}
                                    </span>
                                    {!v.retiredAt && (
                                      <span className="flex gap-1.5">
                                        <Pick onClick={() => variantAction(c.id, v.id, "winner")} disabled={!!busy} active={!v.winner}>Winner</Pick>
                                        <Pick onClick={() => variantAction(c.id, v.id, "retire")} disabled={!!busy} danger>Retire</Pick>
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="mt-2 whitespace-pre-wrap p-3 text-[13px] leading-relaxed" style={{ backgroundColor: INSETB, color: INKB, opacity: v.retiredAt ? 0.55 : 1 }}>{v.body}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Section>

                {/* landing pages */}
                <Section n={3} title="Landing pages" right={
                  <span className="flex items-center gap-2">
                    <span style={MICRO}>{landings ? `${landings.length} PUBLISHED` : "LOADING…"}</span>
                    <Action onClick={() => writeLanding(null, null)} disabled={!!busy}>{busy === "landing" ? "WRITING…" : "WRITE A PAGE"}</Action>
                  </span>
                }>
                  {landings?.length === 0 && <Thin>No landing pages yet. Each is written through the brain for one real product and served server-rendered by the store, so an agent following an ad link reads the same truth a human does.</Thin>}
                  {(landings ?? []).map((l) => (
                    <div key={l.id} className="py-3" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Stamp text={l.id} color={LIVE} />
                        <a href={`/store/${biz.business.slug}/l/${l.id}`} target="_blank" rel="noreferrer" className="min-w-0 text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>
                          {l.headline} <span style={{ color: LIVE }}>↗</span>
                        </a>
                        {l.campaignId && <Stamp text={l.campaignId} color={DIMB} />}
                        {l.sku && <span style={MICRO}>{l.sku}</span>}
                        <span className="ml-auto flex items-center gap-3">
                          <span style={MICRO}>{l.views} VIEW{l.views === 1 ? "" : "S"} · MEASURED</span>
                          <Pick onClick={() => removeLanding(l.id)} disabled={!!busy} danger>Remove</Pick>
                        </span>
                      </div>
                      <div className="mt-1.5 text-pretty text-[12.5px]" style={{ color: DIMB }}>{l.subhead}</div>
                      {l.bullets.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-0.5">
                          {l.bullets.map((x) => <li key={x} className="text-[12px]" style={{ color: DIMB }}>— {x}</li>)}
                        </ul>
                      )}
                      <div className="mt-1.5" style={MICRO}>CTA · {l.cta}{l.audience ? ` · FOR ${l.audience.toUpperCase()}` : ""}</div>
                    </div>
                  ))}
                </Section>

                <Section n={4} title="Draft desk — quick copy grounded in the catalog"
                  right={<div className="flex flex-wrap gap-1.5">{["LINKEDIN", "X", "INSTAGRAM", "TIKTOK"].map((pf) => (
                    <Pick key={pf} onClick={() => generateDraft(pf)} active={draftPf === pf} disabled={!!busy}>
                      {busy === `draft-${pf}` ? "…" : pf.charAt(0) + pf.slice(1).toLowerCase()}
                    </Pick>
                  ))}</div>}>
                  {draft ? (
                    <div className="whitespace-pre-wrap p-4 text-[13.5px] leading-relaxed" style={{ backgroundColor: INSETB, color: INKB }}>{draft}</div>
                  ) : <Thin>Pick a channel — the worker writes through every brain rule, selling a real product at its exact price.</Thin>}
                </Section>

                <Section n={3} title="Audience learning" right={<span style={MICRO}>DISTILLED FROM MEASURED OUTCOMES</span>}>
                  {!biz.brain || biz.brain.learned.length === 0 ? <Thin>Nothing learned yet — needs measured signal before it will conclude anything.</Thin>
                    : biz.brain.learned.map((r) => (
                      <Row key={r.k}>
                        <Stamp text={`${r.k} ${r.kind === "do" ? "do" : "don't"}`} color={LIVE} />
                        <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{r.txt}</span>
                      </Row>
                    ))}
                </Section>

                <Section n={4} title="Channel performance" right={<Stamp text="awaiting connection" color={WARNB} />}>
                  <Thin>
                    ROAS · CAC · CTR · conversion · spend go live the moment an ad account is connected (Meta · Google · TikTok).
                    Commerce will not render a simulated campaign number.
                  </Thin>
                </Section>
                <AuditLine measured="drafts · brain rules applied · learned rules" awaiting="ad accounts · rendered creatives (Higgsfield key)" />
              </>
            )}

            {/* ══════════ 03 SOCIAL ══════════ */}
            {view === "SOCIAL" && (
              <>
                <Section n={1} title="Content generation" right={<div className="flex flex-wrap gap-1.5">{["INSTAGRAM", "TIKTOK", "X"].map((pf) => (
                  <Pick key={pf} onClick={() => generateDraft(pf)} active={draftPf === pf} disabled={!!busy}>{busy === `draft-${pf}` ? "…" : pf.charAt(0) + pf.slice(1).toLowerCase()}</Pick>
                ))}</div>}>
                  {draft ? <div className="whitespace-pre-wrap p-4 text-[13.5px] leading-relaxed" style={{ backgroundColor: INSETB }}>{draft}</div>
                    : <Thin>Generate platform-native content through the brain — same grounding rules as paid creative.</Thin>}
                </Section>
                <Section n={2} title="Publishing schedule" right={<Stamp text="awaiting connection" color={WARNB} />}>
                  <Thin>Automatic posting, cadence and engagement analysis activate when social accounts (or an aggregator) are connected. Generation works today; delivery is the gate.</Thin>
                </Section>
                <Section n={3} title="Short-form video" right={<Stamp text="specs ready" color={LIVE} />}>
                  <Thin>
                    Shot-level render specs — visual prompt, camera move, seconds and overlay per shot, inside the company&apos;s visual world — are produced and linted in Studio.
                    Rendering activates with the Higgsfield key; the contract is already written.
                  </Thin>
                </Section>
                <AuditLine measured="generated content · brain rules" awaiting="platform connections · Higgsfield renders" />
              </>
            )}

            {/* ══════════ 04 OPERATIONS ══════════ */}
            {view === "OPERATIONS" && (
              <>
                <Section n={1} title="Operations worker" right={<Stamp text="operations" color={OKB} />}>
                  <Queue worker="OPERATIONS" />
                </Section>
                <Section n={2} title="Order book" right={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {["all", "received", "confirmed", "shipped", "delivered", "cancelled"].map((f) => (
                      <Pick key={f} onClick={() => setOrderFilter(f)} active={orderFilter === f}>{f.charAt(0).toUpperCase() + f.slice(1)}</Pick>
                    ))}
                  </div>
                }>
                  <Heads cols="112px minmax(0,1fr) 96px 92px auto" labels={["DATE", "ITEM", "CHANNEL", "STATUS", "ADVANCE"]} />
                  {filteredOrders.length === 0 && <Thin>No orders match this filter.</Thin>}
                  {filteredOrders.map((o) => (
                    <Row key={o.id} cols="112px minmax(0,1fr) 96px 92px auto">
                      <Num color={FAINTB}>{o.ts.slice(5, 10)} {o.ts.slice(11, 16)}</Num>
                      <span className="truncate text-[13.5px] font-semibold">{o.productName} <Num color={DIMB}>×{o.qty}</Num></span>
                      <span className="text-[12px] font-semibold" style={{ color: o.channel === "agent-json" ? LIVE : DIMB }}>{o.channel === "agent-json" ? o.agent : "Web"}</span>
                      <Stamp text={o.status} color={STATUS_C[o.status] ?? DIMB} />
                      <span className="flex justify-end gap-1.5">
                        {(FLOW_NEXT[o.status] ?? []).map((nx) => (
                          <Pick key={nx} onClick={() => advanceOrder(o.id, nx)} disabled={!!busy} danger={nx === "cancelled"} active={nx !== "cancelled"}>
                            {nx === "cancelled" ? "Cancel" : nx.charAt(0).toUpperCase() + nx.slice(1)}
                          </Pick>
                        ))}
                      </span>
                    </Row>
                  ))}
                </Section>
                <Section n={3} title="Warehouse" right={<span style={MICRO}>ORDERS DECREMENT STOCK · 0 FLIPS AVAILABILITY</span>}>
                  <Heads cols="minmax(0,1fr) 84px 140px 72px auto" labels={["PRODUCT", "PRICE", "LEVEL", "ON HAND", "REPLENISH"]} />
                  {biz.business.catalog.map((p) => {
                    const lvl = p.stock === 0 ? FAULTB : p.stock <= 3 ? WARNB : OKB;
                    return (
                      <Row key={p.sku} cols="minmax(0,1fr) 84px 140px 72px auto">
                        <a href={`/store/${biz.business.slug}/p/${p.sku}`} target="_blank" rel="noreferrer" className="truncate text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>{p.name}</a>
                        <Num color={DIMB}>{p.price}</Num>
                        <Bar pct={Math.min(100, ((p.stock ?? 0) / 24) * 100)} color={lvl} />
                        <Num color={p.stock === 0 ? FAULTB : DIMB} bold>{p.availability === "PreOrder" ? "PRE" : p.stock === 0 ? "OUT" : `${p.stock}u`}</Num>
                        <span className="flex justify-end"><Pick onClick={() => restock(p.sku)} disabled={!!busy} active>{busy === `r-${p.sku}` ? "…" : "Restock +12"}</Pick></span>
                      </Row>
                    );
                  })}
                </Section>
                <AuditLine measured="orders · lifecycle · stock levels · availability" awaiting="carrier tracking · supplier feeds" />
              </>
            )}

            {/* ══════════ 05 FINANCE ══════════ */}
            {view === "FINANCE" && (
              <>
                <Section n={1} title="Finance worker" right={<Stamp text="finance" color={INKB} />}>
                  <Queue worker="FINANCE" />
                </Section>
                <Section n={2} title="Position" right={<span style={MICRO}>{biz.finance.costsOnFile}/{biz.finance.skuCount} SKUS COSTED · {biz.finance.expenseCount} EXPENSE ENTRIES</span>}>
                  <FigureRow>
                    <Figure label="REVENUE" value={`€${biz.finance.revenue.toLocaleString("en-US")}`} color={OKB} />
                    <Figure label="GROSS PROFIT" value={biz.finance.grossProfit != null ? `€${biz.finance.grossProfit.toLocaleString("en-US")}` : "—"} color={biz.finance.grossProfit != null ? OKB : FAINTB} note={biz.finance.grossProfit == null ? "needs unit costs" : `COGS €${biz.finance.cogs}`} />
                    <Figure label="MARGIN" value={biz.finance.marginPct != null ? `${biz.finance.marginPct}%` : "—"} color={biz.finance.marginPct != null ? (biz.finance.marginPct >= 30 ? OKB : WARNB) : FAINTB} />
                    <Figure label="EXPENSES" value={`€${biz.finance.expenses.toLocaleString("en-US")}`} color={biz.finance.expenses ? WARNB : FAINTB} note={biz.finance.runwayNote} />
                    <Figure label="NET PROFIT" value={biz.finance.netProfit != null ? `€${biz.finance.netProfit.toLocaleString("en-US")}` : "—"} color={biz.finance.netProfit == null ? FAINTB : biz.finance.netProfit >= 0 ? OKB : FAULTB} note={biz.finance.netProfit == null ? "needs costs + expenses" : "revenue − COGS − expenses"} />
                    <Figure label="RECURRING REV" value={`€${biz.finance.recurringRevenue.toLocaleString("en-US")}`} color={LIVE} note={`€${biz.finance.oneOffRevenue} one-off · AOV €${biz.finance.avgOrderValue}`} />
                  </FigureRow>
                  <div className="pt-3" style={MICRO}>INVENTORY €{biz.finance.inventoryAtPrice.toLocaleString("en-US")} AT PRICE{biz.finance.inventoryAtCost != null ? ` · €${biz.finance.inventoryAtCost.toLocaleString("en-US")} AT COST` : ""}</div>
                </Section>

                <Section n={3} title="Cash flow" right={<span style={MICRO}>MONEY IN FROM ORDERS · OUT FROM RECORDED EXPENSES</span>}>
                  {biz.finance.cashFlow.length === 0 ? (
                    <Thin>Nothing to plot yet — cash flow appears once there are orders or recorded expenses. It is never modelled.</Thin>
                  ) : (
                    <>
                      <Heads cols="90px 110px 110px 110px minmax(0,1fr)" labels={["MONTH", "IN", "OUT", "NET", ""]} />
                      {biz.finance.cashFlow.map((m) => {
                        const span = Math.max(m.inflow, m.outflow, 1);
                        return (
                          <Row key={m.month} cols="90px 110px 110px 110px minmax(0,1fr)">
                            <Num color={DIMB}>{m.month}</Num>
                            <Num color={OKB} bold>€{m.inflow}</Num>
                            <Num color={m.outflow ? WARNB : FAINTB}>€{m.outflow}</Num>
                            <Num color={m.net >= 0 ? OKB : FAULTB} bold>{m.net >= 0 ? "+" : "−"}€{Math.abs(m.net)}</Num>
                            <span className="flex items-center gap-1.5">
                              <Bar pct={(m.inflow / span) * 100} color={OKB} width={110} />
                              <Bar pct={(m.outflow / span) * 100} color={WARNB} width={110} />
                            </span>
                          </Row>
                        );
                      })}
                    </>
                  )}
                </Section>

                <Section n={4} title="Expenses" right={
                  <span style={MICRO}>
                    {Object.entries(biz.finance.expensesByCategory).length > 0
                      ? Object.entries(biz.finance.expensesByCategory).map(([c, v]) => `${c.toUpperCase()} €${Math.round(v)}`).join(" · ")
                      : "NOTHING RECORDED"}
                  </span>
                }>
                  <div className="flex flex-wrap items-center gap-2 py-3">
                    <input value={exLabel} onChange={(e) => setExLabel(e.target.value)} placeholder="What was it for — e.g. clay order, Meta ads"
                      className="h-9 min-w-[220px] flex-1 px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <span className="flex items-center gap-1">
                      <span style={{ fontFamily: MONO, color: FAINTB, fontSize: 12 }}>€</span>
                      <input value={exAmount} onChange={(e) => setExAmount(e.target.value)} placeholder="0"
                        className="h-9 w-[88px] px-2 text-[13px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    </span>
                    <select value={exCategory} onChange={(e) => setExCategory(e.target.value)} className="h-9 px-2 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent" }}>
                      {["materials", "advertising", "software", "shipping", "fees", "rent", "salary", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Pick onClick={() => setExRecurring(!exRecurring)} active={exRecurring}>{exRecurring ? "Monthly" : "One-off"}</Pick>
                    <Action onClick={addExpense} disabled={!!busy || !exLabel.trim() || !(Number(exAmount) > 0)}>
                      {busy === "expense" ? "RECORDING…" : "RECORD"}
                    </Action>
                  </div>
                  {expenses?.length === 0 && <Thin>No expenses recorded. Revenue and COGS are measured for you; operating costs are knowledge only you have — record them and net profit and cash flow become real.</Thin>}
                  {(expenses ?? []).map((e) => (
                    <Row key={e.id} cols="96px minmax(0,1fr) 110px 96px 80px auto">
                      <Num color={FAINTB}>{e.date}</Num>
                      <span className="truncate text-[13px] font-semibold">{e.label}</span>
                      <Stamp text={e.category} color={DIMB} />
                      <Num color={WARNB} bold>€{e.amount}</Num>
                      <span>{e.recurring ? <Stamp text="monthly" color={LIVE} /> : <span style={MICRO}>one-off</span>}</span>
                      <span className="flex justify-end"><Pick onClick={() => removeExpense(e.id)} disabled={!!busy} danger>Remove</Pick></span>
                    </Row>
                  ))}
                </Section>

                <Section n={5} title="Unit economics" right={<Action onClick={saveCosts} disabled={!!busy}>{busy === "costs" ? "SAVING…" : "SAVE COSTS"}</Action>}>
                  <Heads cols="minmax(0,1fr) 78px 92px 82px 64px 88px" labels={["PRODUCT", "PRICE", "UNIT COST", "MARGIN", "SOLD", "PROFIT"]} />
                  {biz.finance.perSku.map((p) => (
                    <Row key={p.sku} cols="minmax(0,1fr) 78px 92px 82px 64px 88px">
                      <span className="truncate text-[13.5px] font-semibold">
                        {p.name} {p.recurring && <Stamp text="sub" color={LIVE} />}
                      </span>
                      <Num color={DIMB}>{p.price}</Num>
                      <span className="flex items-center gap-1">
                        <span style={{ fontFamily: MONO, color: FAINTB, fontSize: 11 }}>€</span>
                        <input value={costDraft[p.sku] ?? ""} onChange={(e) => setCostDraft((c) => ({ ...c, [p.sku]: e.target.value }))} placeholder="—"
                          className="h-7 w-16 px-1.5 text-[12px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                      </span>
                      <Num color={p.marginPct == null ? FAINTB : p.marginPct >= 30 ? OKB : WARNB} bold>{p.marginPct == null ? "—" : `${p.marginPct}%`}</Num>
                      <Num color={DIMB}>{p.sold}</Num>
                      <Num color={p.profit == null ? FAINTB : OKB} bold>{p.profit == null ? "—" : `€${p.profit}`}</Num>
                    </Row>
                  ))}
                  <div className="pt-3 text-[12.5px]" style={{ color: DIMB }}>
                    Revenue is measured; unit cost is knowledge only you have. Enter costs to unlock margin, COGS, profit per SKU and true inventory value —
                    Commerce will never estimate them.
                  </div>
                </Section>
                <AuditLine
                  measured="revenue · COGS & margin (where costs are set) · recorded expenses · net profit · cash flow · inventory value"
                  awaiting={`forecasts (need deeper history)${biz.finance.expenseCount === 0 ? " · expenses (none recorded)" : ""}${biz.finance.costsOnFile === 0 ? " · unit costs" : ""}`}
                />
              </>
            )}

            {/* ══════════ 06 AI COMMERCE ══════════ */}
            {view === "AI COMMERCE" && (
              <>
                <Section n={1} title="The agent funnel" right={<span style={MICRO}>DISCOVERY → RETRIEVAL → PURCHASE</span>}>
                  <FigureRow cols={5}>
                    <Figure label="AGENT CRAWLS" value={biz.traffic.agents} color={LIVE} />
                    <Figure label="PRODUCT RETRIEVALS" value={biz.traffic.byKind["product"] ?? 0} color={LIVE} />
                    <Figure label="FEED PULLS" value={biz.traffic.byKind["feed"] ?? 0} color={LIVE} />
                    <Figure label="AGENT ORDERS" value={agentOrders} color={OKB} />
                    <Figure label="READ → ORDER" value={biz.traffic.agents ? `${Math.round((agentOrders / biz.traffic.agents) * 100)}%` : "—"} />
                  </FigureRow>
                </Section>
                <Section n={2} title="Who reads the store">
                  {Object.keys(biz.traffic.byAgent).length === 0 ? <Thin>No AI agents have read the store yet — public hosting and feed submission is the unlock.</Thin> : (
                    <>
                      {Object.entries(biz.traffic.byAgent).sort((a, b) => b[1] - a[1]).map(([a, n]) => (
                        <Row key={a} cols="150px minmax(0,1fr) 48px 110px">
                          <span className="truncate text-[13px] font-semibold">{a}</span>
                          <Bar pct={(n / maxAgent) * 100} width={99999} />
                          <Num color={DIMB}>{n}</Num>
                          <span>{biz.orders.byAgent[a] ? <Stamp text={`${biz.orders.byAgent[a]} order${biz.orders.byAgent[a] > 1 ? "s" : ""}`} color={OKB} /> : <span style={MICRO}>no orders</span>}</span>
                        </Row>
                      ))}
                      <Row><span className="text-[12.5px]" style={{ color: DIMB }}>Human visitors: <Num color={INKB} bold>{biz.traffic.humans}</Num> — the store serves both surfaces.</span></Row>
                    </>
                  )}
                </Section>
                <Section n={3} title="Readiness" right={<Action onClick={runReadiness} disabled={!!busy}>{busy === "report" ? "CRAWLING…" : "RUN CHECK"}</Action>}>
                  {!report ? <Thin>Crawls your own storefront with JavaScript off — the way GPTBot sees it — and scores structured data, feeds, robots, checkout and the order API.</Thin> : (
                    <>
                      <div className="flex items-baseline gap-4 pb-2">
                        <span className="font-display text-[3rem] leading-none tabular-nums" style={{ color: report.score >= 70 ? OKB : WARNB }}>{report.score}</span>
                        <span style={MICRO}>/ 100 HEALTH SCORE</span>
                      </div>
                      {report.checks.map((c) => (
                        <Row key={c.k} cols="52px 240px minmax(0,1fr)">
                          <Stamp text={c.status} color={c.status === "PASS" ? OKB : c.status === "WARN" ? WARNB : FAULTB} />
                          <span className="text-[13px] font-semibold">{c.label}</span>
                          <span className="text-pretty text-[12.5px]" style={{ color: DIMB }}>{c.note}</span>
                        </Row>
                      ))}
                    </>
                  )}
                </Section>
                <Section n={4} title="Visibility — what agents actually retrieve">
                  <Heads cols="minmax(0,1fr) 110px auto" labels={["PRODUCT", "RETRIEVALS", "SIGNAL"]} />
                  {biz.business.catalog.map((p) => {
                    const reads = biz.traffic.byProduct[p.sku] ?? 0;
                    return (
                      <Row key={p.sku} cols="minmax(0,1fr) 110px auto">
                        <span className="truncate text-[13.5px] font-semibold">{p.name}</span>
                        <Num color={reads ? LIVE : FAINTB} bold>{reads}</Num>
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {biz.orders.bySku[p.name] && <Stamp text={`${biz.orders.bySku[p.name].qty} sold`} color={OKB} />}
                          {reads === 0 && <Stamp text="never retrieved" color={WARNB} />}
                          {reads > 0 && !biz.orders.bySku[p.name] && <Stamp text="read, never bought" color={LIVE} />}
                        </span>
                      </Row>
                    );
                  })}
                </Section>
                <AuditLine measured="crawls · retrievals · feed pulls · agent orders · readiness" awaiting="feed submission (needs public hosting) · UCP/ACP checkout" />
              </>
            )}

            {/* ══════════ 07 PRODUCTS ══════════ */}
            {view === "PRODUCTS" && (
              <>
                <Section n={1} title="Add to the catalog" right={<span style={MICRO}>WRITES STRAIGHT TO THE LIVE STORE</span>}>
                  <div className="flex flex-wrap items-center gap-2 py-3">
                    <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Product name"
                      className="h-9 min-w-[180px] flex-1 px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <input value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="24 or 14/mo"
                      className="h-9 w-[108px] px-2 text-[13px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <input value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="Category"
                      className="h-9 w-[136px] px-2 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    {pKind === "good" && (
                      <span className="flex items-center gap-1">
                        <span style={MICRO}>STOCK</span>
                        <input value={pStock} onChange={(e) => setPStock(e.target.value)}
                          className="h-9 w-[64px] px-2 text-[13px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pb-3">
                    <span style={MICRO}>SELLING</span>
                    {([["good", "A physical thing"], ["digital", "A file"], ["service", "Work / time"], ["access", "A pass"]] as const).map(([k, lbl]) => (
                      <Pick key={k} active={pKind === k} onClick={() => setPKind(k)}>{lbl}</Pick>
                    ))}
                    <span style={MICRO}>PRICED PER</span>
                    <select value={pUnit} onChange={(e) => setPUnit(e.target.value)} className="h-8 px-2 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent" }}>
                      {["item", "hour", "day", "seat", "month", "year", "1k-words", "project"].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <span className="min-w-[220px] flex-1 text-[12px]" style={{ color: DIMB }}>
                      {pKind === "good"
                        ? "A good has stock, ships, and belongs in the Merchant feed."
                        : pKind === "service"
                          ? "Work is booked, not shipped: no stock, no address at checkout, and the offer publishes as a schema.org Service kept out of the Merchant feed."
                          : pKind === "access"
                            ? "A pass grants access: no stock, no shipping, published as a Service."
                            : "A file is delivered to the buyer's email: no stock, no shipping address."}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 pb-3">
                    <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={2}
                      placeholder="What it is, who it is for, what makes it different — agents answer buyer questions out of this text, so write it for them."
                      className="min-w-[280px] flex-1 px-3 py-2 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none", resize: "vertical" }} />
                    <Action onClick={addProduct} disabled={!!busy || !pName.trim() || !pPrice.trim() || pDesc.trim().length < 12}>
                      {busy === "addp" ? "PUBLISHING…" : "PUBLISH PRODUCT"}
                    </Action>
                  </div>
                  <div className="text-[12.5px]" style={{ color: DIMB }}>
                    A published product appears immediately in the storefront HTML, its own page, the JSON-LD, both product feeds, llms.txt and the
                    store&apos;s MCP tools — the same second, in every place an agent looks.
                  </div>
                </Section>

                <Section n={2} title="Every product, everything known about it" right={
                  <span style={MICRO}>{biz.business.catalog.filter((p) => p.availability === "Discontinued").length} RETIRED · CLICK A ROW TO MANAGE</span>
                }>
                  <Heads cols="minmax(0,1fr) 76px 62px 56px 78px 68px minmax(0,1.1fr)" labels={["PRODUCT", "PRICE", "STOCK", "SOLD", "REVENUE", "AI READS", "SIGNALS"]} />
                  {biz.business.catalog.map((p) => {
                    const sold = biz.orders.bySku[p.name]?.qty ?? 0;
                    const rev = Math.round(biz.orders.bySku[p.name]?.revenue ?? 0);
                    const reads = biz.traffic.byProduct[p.sku] ?? 0;
                    const share = biz.orders.revenue ? Math.round((rev / biz.orders.revenue) * 100) : 0;
                    const fin = biz.finance.perSku.find((x) => x.sku === p.sku);
                    const retired = p.availability === "Discontinued";
                    const open = openSku === p.sku;
                    return (
                      <div key={p.sku} style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: retired ? `2px solid ${FAINTB}` : "2px solid transparent", opacity: retired ? 0.66 : 1 }}>
                        <div className="grid items-center gap-x-4 gap-y-1.5 px-1 py-3" style={{ gridTemplateColumns: "minmax(0,1fr) 76px 62px 56px 78px 68px minmax(0,1.1fr)", fontFamily: SANS }}>
                          <a href={`/store/${biz.business.slug}/p/${p.sku}`} target="_blank" rel="noreferrer" className="truncate text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>{p.name}</a>
                          <Num color={DIMB}>{p.price}{p.unit && p.unit !== "item" ? `/${p.unit}` : ""}</Num>
                          <Num color={p.kind && p.kind !== "good" ? FAINTB : p.stock === 0 ? FAULTB : DIMB}>
                            {p.kind && p.kind !== "good" ? "—" : `${p.stock}u`}
                          </Num>
                          <Num color={DIMB}>{sold}</Num>
                          <Num color={rev ? OKB : FAINTB} bold>€{rev}</Num>
                          <Num color={reads ? LIVE : FAINTB}>{reads}</Num>
                          <span className="flex flex-wrap items-center justify-end gap-1.5">
                            {retired && <Stamp text="retired" color={FAINTB} />}
                            {p.kind && p.kind !== "good" && <Stamp text={p.kind} color={DIMB} />}
                            {!retired && !p.provenance?.material && !p.provenance?.origin && <Stamp text="no provenance" color={WARNB} />}
                            {!retired && p.provenance?.madeBy === "human" && <Stamp text="human-made" color={LIVE} />}
                            {!retired && share >= 50 && <Stamp text={`${share}% of revenue`} color={OKB} />}
                            {!retired && fin?.marginPct != null && fin.marginPct < 20 && <Stamp text={`thin margin ${fin.marginPct}%`} color={WARNB} />}
                            {!retired && reads === 0 && <Stamp text="invisible to AI" color={WARNB} />}
                            {!retired && p.stock <= 3 && p.availability !== "PreOrder" && <Stamp text={p.stock === 0 ? "out of stock" : "low stock"} color={p.stock === 0 ? FAULTB : WARNB} />}
                            {!retired && sold === 0 && reads > 0 && <Stamp text="read, never bought" color={LIVE} />}
                            <Pick onClick={() => { setOpenSku(open ? null : p.sku); setEPrice(p.price.replace(/^€/, "").replace(/\/(mo|yr)$/, "")); setEStock(String(p.stock)); setEKind(p.kind ?? "good"); setEUnit(p.unit ?? "item"); setProv({ ...(p.provenance ?? {}) } as Record<string, string>); }} active={open}>
                              {open ? "Close" : "Manage"}
                            </Pick>
                          </span>
                        </div>
                        {open && (
                          <div className="mx-1 mb-3 flex flex-wrap items-center gap-2 px-3 py-3" style={{ backgroundColor: INSETB }}>
                            <span style={MICRO}>PRICE €</span>
                            <input value={ePrice} onChange={(e) => setEPrice(e.target.value)}
                              className="h-8 w-[92px] px-2 text-[12.5px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: PAPER, color: INKB, outline: "none" }} />
                            <span style={MICRO}>PER</span>
                            <select value={eUnit} onChange={(e) => setEUnit(e.target.value)} className="h-8 px-2 text-[12px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: PAPER }}>
                              {["item", "hour", "day", "seat", "month", "year", "1k-words", "project"].map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                            {(!p.kind || p.kind === "good") && <>
                              <span style={MICRO}>STOCK</span>
                              <input value={eStock} onChange={(e) => setEStock(e.target.value)}
                                className="h-8 w-[72px] px-2 text-[12.5px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: PAPER, color: INKB, outline: "none" }} />
                            </>}
                            <span style={MICRO}>IS A</span>
                            <select value={eKind} onChange={(e) => setEKind(e.target.value)} className="h-8 px-2 text-[12px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: PAPER }}>
                              <option value="good">physical thing</option><option value="digital">file</option><option value="service">service</option><option value="access">access pass</option>
                            </select>
                            <Action onClick={() => saveProduct(p.sku)} disabled={!!busy}>{busy === `up-${p.sku}` ? "SAVING…" : "SAVE"}</Action>
                            {!retired && (
                              <Pick onClick={() => setProductAvailability(p.sku, p.availability === "PreOrder" ? "InStock" : "PreOrder")}
                                disabled={!!busy} active={p.availability === "PreOrder"}>
                                {p.availability === "PreOrder" ? "Pre-order" : "Sell now"}
                              </Pick>
                            )}
                            {retired
                              ? <Pick onClick={() => productOp(p.sku, "restore")} disabled={!!busy} active>Put back on the shelf</Pick>
                              : <Pick onClick={() => productOp(p.sku, "retire")} disabled={!!busy} danger>Retire</Pick>}
                            <span className="min-w-[240px] flex-1 text-[12px]" style={{ color: DIMB }}>
                              {retired
                                ? "Retired: dropped from both feeds and from agent search, page still answers “Discontinued”."
                                : "Retiring drops it from the feeds and agent search but keeps its URL answering — no dead links for agents that cached it. Nothing is ever deleted."}
                            </span>

                            {/* Provenance — the facts a buying agent filters on. */}
                            <div className="mt-2 w-full pt-3" style={{ borderTop: `1px solid ${HAIRB}` }}>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span style={MICRO}>PROVENANCE</span>
                                <span className="text-[12px]" style={{ color: DIMB }}>
                                  What it is, where it is from, who made it — written into the JSON-LD, both feeds and the MCP tools. Leave a field empty and it is simply not claimed.
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {([["material", "Material"], ["origin", "Made in"], ["leadTime", "Lead time"], ["care", "Care"], ["warranty", "Warranty"], ["weight", "Weight"], ["dimensions", "Dimensions"]] as const).map(([k, lbl]) => (
                                  <span key={k} className="flex items-center gap-1">
                                    <span style={MICRO}>{lbl}</span>
                                    <input value={prov[k] ?? ""} onChange={(e) => setProv((v) => ({ ...v, [k]: e.target.value }))}
                                      className="h-8 w-[128px] px-2 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: PAPER, color: INKB, outline: "none" }} />
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span style={MICRO}>MADE BY</span>
                                {(["human", "hybrid", "machine"] as const).map((m) => (
                                  <Pick key={m} active={prov.madeBy === m} onClick={() => setProv((v) => ({ ...v, madeBy: v.madeBy === m ? "" : m }))}>
                                    {m === "human" ? "A person" : m === "hybrid" ? "Person + machine" : "Machine"}
                                  </Pick>
                                ))}
                                <Action onClick={() => saveProvenance(p.sku)} disabled={!!busy}>{busy === `pv-${p.sku}` ? "SAVING…" : "SAVE PROVENANCE"}</Action>
                                <span className="text-[12px]" style={{ color: DIMB }}>
                                  “Made by a person” stops being a story on an about page once agents do the choosing — it becomes a filter value.
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Section>
                <AuditLine measured="price · stock · units sold · revenue share · agent retrievals · margin (where costed)" awaiting="competitor pricing · campaign performance per product" />
              </>
            )}

            {/* ══════════ 08 CUSTOMERS ══════════ */}
            {view === "CUSTOMERS" && (
              <>
                <Section n={1} title="The book" right={
                  <span style={MICRO}>
                    AVG LTV €{biz.customers.length ? Math.round(biz.customers.reduce((a, c) => a + c.revenue, 0) / biz.customers.length) : 0} ·
                    REPEAT {biz.customers.length ? Math.round((biz.customers.filter((c) => c.orders > 1).length / biz.customers.length) * 100) : 0}%
                  </span>
                }>
                  <Heads cols="160px minmax(0,1fr) 90px 76px 90px" labels={["CUSTOMER", "EMAIL", "ORDERS", "SEGMENT", "LTV"]} />
                  {biz.customers.length === 0 && <Thin>No customers yet.</Thin>}
                  {biz.customers.map((c) => (
                    <Row key={c.email} cols="160px minmax(0,1fr) 90px 76px 90px">
                      <span className="truncate text-[13.5px] font-semibold">{c.name}</span>
                      <span className="truncate text-[12px]" style={{ fontFamily: MONO, color: FAINTB }}>{c.email}</span>
                      <Num color={DIMB}>{c.orders}</Num>
                      <Stamp text={c.orders > 1 ? "repeat" : "new"} color={c.orders > 1 ? OKB : DIMB} />
                      <span className="text-right"><Num color={OKB} bold>€{Math.round(c.revenue)}</Num></span>
                    </Row>
                  ))}
                </Section>
                <AuditLine measured="orders per customer · lifetime value · repeat rate" awaiting="churn prediction (needs history) · support history" />
              </>
            )}

            {/* ══════════ 09 BRAIN ══════════ */}
            {view === "BRAIN" && (
              <>
                <Section n={1} title="Teach the brain" right={
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(["copy", "video"] as const).map((d) => <Pick key={d} onClick={() => setTeachDomain(d)} active={teachDomain === d}>{d.charAt(0).toUpperCase() + d.slice(1)}</Pick>)}
                  </div>
                }>
                  <div className="flex flex-wrap items-center gap-2 py-3">
                    <input value={teachTxt} onChange={(e) => setTeachTxt(e.target.value)} placeholder="e.g. never discount handmade goods"
                      className="h-9 min-w-[260px] flex-1 px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <Action onClick={() => teach("do")} disabled={!teachTxt.trim() || !!busy}>+ ALWAYS</Action>
                    <Action onClick={() => teach("dont")} disabled={!teachTxt.trim() || !!busy} danger>+ NEVER</Action>
                  </div>
                  <div className="text-[12.5px]" style={{ color: DIMB }}>Taught rules persist per company and steer every draft, ad and render spec from that moment on.</div>
                </Section>
                {brainFull?.visual && (
                  <Section n={2} title="Visual world" right={<span style={MICRO}>EVERY AD IS SHOT IN IT</span>}>
                    <div className="grid gap-x-10 gap-y-4 py-2 sm:grid-cols-2">
                      {Object.entries(brainFull.visual).map(([k, v]) => (
                        <div key={k}><div style={MICRO}>{k}</div><div className="mt-1 text-pretty text-[13px]" style={{ color: DIMB }}>{String(v)}</div></div>
                      ))}
                    </div>
                  </Section>
                )}
                {(["company", "taught", "learned", "core"] as const).map((src, idx) => {
                  const rules = (brainFull?.rules ?? []).filter((r) => r.src === src);
                  if (!brainFull) return src === "company" ? <Section key={src} n={3} title="Rules"><Thin>Loading the brain…</Thin></Section> : null;
                  if (rules.length === 0) return null;
                  const c = src === "learned" ? LIVE : src === "company" ? OKB : src === "taught" ? WARNB : DIMB;
                  return (
                    <Section key={src} n={(brainFull?.visual ? 3 : 2) + idx} title={`${src.charAt(0).toUpperCase() + src.slice(1)} rules`} right={<span style={MICRO}>{rules.length} RULES</span>}>
                      {rules.map((r) => (
                        <Row key={r.k}>
                          <Stamp text={r.k} color={c} />
                          <Stamp text={r.kind === "do" ? "do" : "don't"} color={r.kind === "do" ? OKB : FAULTB} />
                          {r.domain === "video" && <Stamp text="video" color={DIMB} />}
                          <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{r.txt}</span>
                          {src !== "core" && <button onClick={() => forgetRule(r.k)} disabled={!!busy} aria-label={`Remove ${r.k}`} className="text-[13px] disabled:opacity-40" style={{ color: FAULTB }}>✕</button>}
                        </Row>
                      ))}
                    </Section>
                  );
                })}
                <AuditLine measured="all rule layers · visual world · what each rule steers" />
              </>
            )}

            {/* ══════════ 10 AUTOMATION ══════════ */}
            {view === "AUTOMATION" && (
              <>
                <Section n={1} title="Arm a rule" right={<span style={MICRO}>MEASURED CONDITION → ORDERED PLAN</span>}>
                  <div className="flex flex-wrap items-center gap-2 py-3 text-[13px]">
                    <span style={MICRO}>IF</span>
                    <select value={autoMetric} onChange={(e) => setAutoMetric(e.target.value)} className="h-8 px-2 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent" }}>
                      {AUTO_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                    <select value={autoOp} onChange={(e) => setAutoOp(e.target.value)} className="h-8 px-2 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent" }}>
                      <option value="<">below</option><option value=">">above</option>
                    </select>
                    <input value={autoVal} onChange={(e) => setAutoVal(e.target.value)} className="h-8 w-20 px-2 text-[12.5px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", outline: "none" }} />
                    <span style={MICRO}>{AUTO_METRICS.find((m) => m.key === autoMetric)?.unit}</span>
                    {(() => {
                      const now = (metricNow ?? biz.automations.metrics)?.[autoMetric];
                      return <Stamp text={now == null ? "not measurable yet" : `now ${now}`} color={now == null ? WARNB : LIVE} />;
                    })()}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 pb-3">
                    {AUTO_METRICS.map((m) => {
                      const v = (metricNow ?? biz.automations.metrics)?.[m.key];
                      return (
                        <span key={m.key} style={{ ...MICRO, color: v == null ? FAINTB : DIMB }}>
                          {m.label} <b style={{ color: v == null ? FAINTB : LIVE }}>{v == null ? "—" : v}</b>
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pb-3 text-[13px]" style={{ borderTop: `1px solid ${HAIRB}`, paddingTop: 12 }}>
                    <span style={MICRO}>THEN, IN ORDER</span>
                    {AUTO_STEPS.map((s) => {
                      const i = autoActs.indexOf(s.key);
                      return (
                        <Pick key={s.key} active={i >= 0}
                          onClick={() => setAutoActs((a) => a.includes(s.key) ? a.filter((x) => x !== s.key) : [...a, s.key])}>
                          {i >= 0 ? `${i + 1}. ` : ""}{s.label}
                        </Pick>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pb-3">
                    <Pick onClick={() => setAutoHold(!autoHold)} active={autoHold}>{autoHold ? "Holds for approval" : "Acts on its own"}</Pick>
                    <Action onClick={addAuto} disabled={!!busy || autoActs.length === 0}>{busy === "auto" ? "ARMING…" : "ARM RULE"}</Action>
                    <Action onClick={dryRun} disabled={!!busy || !autos?.length} danger>{busy === "dry" ? "TESTING…" : "DRY RUN"}</Action>
                  </div>
                  <div className="text-[12.5px]" style={{ color: DIMB }}>
                    Steps run in the order you pick them, each one recorded separately. A rule set to <b>hold for approval</b> never acts alone — it
                    states its plan and waits for you in the review queue. A metric that cannot be measured honestly (margin without unit costs, days of
                    stock without a sale) skips the rule and says so instead of firing on a zero. One firing per rule per hour.
                  </div>
                  <div className="pt-2 text-[12.5px]" style={{ color: DIMB }}>
                    Rules are evaluated every time this business is read <b>and</b> on every scheduled pass (<span style={{ fontFamily: MONO, fontSize: 11.5 }}>/api/commerce/tick</span>),
                    so the workforce keeps working with nobody watching. The scheduled pass is deterministic and spends no AI budget; the situation
                    report and the learning pass stay yours to trigger.
                  </div>
                </Section>

                {preview && (
                  <Section n={2} title="Dry run — what would happen right now" right={<span style={MICRO}>NOTHING WAS EXECUTED</span>}>
                    {preview.length === 0 && <Thin>No rules to test yet.</Thin>}
                    {preview.map((p) => (
                      <div key={p.id} className="py-3" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Stamp text={p.id} color={p.would ? LIVE : FAINTB} filled={p.would} />
                          <Stamp text={p.would ? "would fire" : "would not fire"} color={p.would ? OKB : DIMB} />
                          {p.requireApproval && <Stamp text="holds for approval" color={WARNB} />}
                          <span className="text-[13px]" style={{ color: DIMB }}>{p.reason}</span>
                        </div>
                        {p.would && (
                          <div className="mt-2 px-3 py-2" style={{ backgroundColor: INSETB }}>
                            {p.plan.map((s) => <div key={s} className="text-[12.5px]" style={{ fontFamily: MONO, color: INKB }}>{s}</div>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </Section>
                )}

                <Section n={preview ? 3 : 2} title="Armed rules" right={
                  <span style={MICRO}>
                    {autos?.length ?? "…"} TOTAL{(autos ?? []).some((r) => r.pending) ? ` · ${(autos ?? []).filter((r) => r.pending).length} AWAITING APPROVAL` : ""}
                  </span>
                }>
                  {autos?.length === 0 && <Thin>No automations armed — the OS only acts alone within limits you define.</Thin>}
                  {(autos ?? []).map((r) => {
                    const open = openRule === r.id;
                    const runs = [...(r.runs ?? [])].reverse();
                    return (
                      <div key={r.id} style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: r.pending ? `2px solid ${WARNB}` : "2px solid transparent" }}>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 py-3">
                          <Stamp text={r.id} color={r.enabled ? LIVE : FAINTB} filled={r.enabled} />
                          <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>
                            If <b style={{ color: INKB }}>{AUTO_METRICS.find((m) => m.key === r.if.metric)?.label ?? r.if.metric.replace(/_/g, " ")} {r.if.op === "<" ? "below" : "above"} {r.if.value}</b>
                            {" "}then <b style={{ color: INKB }}>{r.then.length} step{r.then.length > 1 ? "s" : ""}</b>
                            {r.requireApproval && <> · <span style={{ color: WARNB }}>holds for approval</span></>}
                          </span>
                          {r.lastFired && <Num color={FAINTB}>{r.lastFired.slice(5, 16).replace("T", " ")}</Num>}
                          <span className="flex gap-1.5">
                            <Pick onClick={() => setOpenRule(open ? null : r.id)} active={open}>{open ? "Hide" : `Plan & audit${runs.length ? ` (${runs.length})` : ""}`}</Pick>
                            <Pick onClick={() => toggleAuto(r.id)} disabled={!!busy} active={r.enabled}>{r.enabled ? "On" : "Off"}</Pick>
                            <Pick onClick={() => deleteAuto(r.id)} disabled={!!busy} danger>Remove</Pick>
                          </span>
                        </div>

                        {r.pending && (
                          <div className="mx-1 mb-3 px-3 py-3" style={{ backgroundColor: INSETB, borderLeft: `2px solid ${WARNB}` }}>
                            <div className="flex flex-wrap items-center gap-2">
                              <Stamp text="awaiting your approval" color={WARNB} filled />
                              <span className="text-[13px]" style={{ color: INKB }}>{r.pending.reason}</span>
                            </div>
                            {r.pending.plan.map((s) => <div key={s} className="mt-1 text-[12.5px]" style={{ fontFamily: MONO, color: DIMB }}>{s}</div>)}
                            <div className="mt-3 flex gap-2">
                              <Action onClick={() => ruleOp(r.id, "approve")} disabled={!!busy}>{busy === `t-${r.id}` ? "RUNNING…" : "APPROVE PLAN"}</Action>
                              <Action onClick={() => ruleOp(r.id, "dismiss")} disabled={!!busy} danger>DECLINE</Action>
                            </div>
                          </div>
                        )}

                        {open && (
                          <div className="mx-1 mb-3 px-3 py-3" style={{ backgroundColor: INSETB }}>
                            <div style={MICRO}>THE PLAN</div>
                            {r.then.map((a, i) => (
                              <div key={i} className="mt-1 text-[12.5px]" style={{ fontFamily: MONO, color: INKB }}>
                                {i + 1}. {a.type.replace(/_/g, " ")}{a.qty != null ? ` +${a.qty} units` : ""}{a.pct != null ? ` ${a.pct > 0 ? "+" : ""}${a.pct}%` : ""}{a.sku ? ` · ${a.sku}` : ""}{a.note ? ` · “${a.note}”` : ""}
                              </div>
                            ))}
                            <div className="mt-4" style={MICRO}>AUDIT — LAST {runs.length || 0} EVALUATION{runs.length === 1 ? "" : "S"} THAT MATTERED</div>
                            {runs.length === 0 && <div className="mt-1 text-[12.5px]" style={{ color: DIMB }}>Never evaluated to anything worth recording yet.</div>}
                            {runs.map((run, i) => (
                              <div key={i} className="mt-2 pt-2" style={{ borderTop: `1px solid ${HAIRB}` }}>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Num color={FAINTB}>{run.ts.slice(5, 16).replace("T", " ")}</Num>
                                  <Stamp text={run.held ? "held" : run.fired ? "executed" : "skipped"} color={run.held ? WARNB : run.fired ? OKB : DIMB} />
                                  <span className="text-[12.5px]" style={{ color: DIMB }}>{run.reason}</span>
                                </div>
                                {run.steps.map((s, j) => (
                                  <div key={j} className="mt-0.5 text-[12px]" style={{ fontFamily: MONO, color: s.ok ? INKB : FAULTB }}>
                                    {s.ok ? "✓" : "✕"} {s.type.replace(/_/g, " ")} — {s.detail}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Section>
                <AuditLine
                  measured="rule conditions · every step's outcome · firing history · held plans"
                  awaiting="ad-account actions (need channel connection)"
                />
              </>
            )}

            {/* ══════════ 11 EVENTS ══════════ */}
            {view === "EVENTS" && (
              <>
                <Section n={1} title="Everything the OS did, everything the store took" right={<span style={MICRO}>{ledger.length} ENTRIES · NEWEST FIRST</span>}>
                  {ledger.length === 0 && <Thin>Quiet book — share the store, let agents read it.</Thin>}
                  {ledger.map((l, i) => (
                    <Row key={i} cols="146px 108px 92px minmax(0,1fr)">
                      <Num color={FAINTB}>{l.ts.slice(5, 10)} {l.ts.slice(11, 19)}</Num>
                      <span><Stamp text={l.tag} color={WORKER_C[l.tag] ?? DIMB} /></span>
                      <span>
                        {/* Who set it off — the machine acting alone reads differently
                            from the machine doing as it was told. */}
                        {"by" in l && l.by
                          ? <Stamp text={l.by === "auto" ? "unattended" : "you"} color={l.by === "auto" ? LIVE : DIMB} filled={l.by === "auto"} />
                          : <span style={MICRO}>{["AGENT", "VISITOR", "ORDER"].includes(l.tag) ? "inbound" : "—"}</span>}
                      </span>
                      <span className="min-w-0 text-pretty text-[13px]" style={{ color: DIMB }}>{l.txt}</span>
                    </Row>
                  ))}
                </Section>
              </>
            )}

            {/* ══════════ 12 SETTINGS ══════════ */}
            {view === "SETTINGS" && (
              <>
                <Section n={1} title="Policies" right={<Action onClick={saveSettings} disabled={!!busy}>{busy === "settings" ? "SAVING…" : "SAVE"}</Action>}>
                  <div className="flex flex-col gap-4 py-3">
                    <label className="flex flex-col gap-1.5"><span style={MICRO}>SHIPS</span>
                      <input value={ships} onChange={(e) => setShips(e.target.value)} className="h-9 px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", outline: "none" }} /></label>
                    <label className="flex flex-col gap-1.5"><span style={MICRO}>RETURNS</span>
                      <input value={returns} onChange={(e) => setReturns(e.target.value)} className="h-9 px-3 text-[13px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", outline: "none" }} /></label>
                    <div className="text-[12.5px]" style={{ color: DIMB }}>Saved policies appear immediately in the live storefront&apos;s pages, its JSON-LD and its product feed — for humans and agents alike.</div>
                  </div>
                </Section>
                <Section n={2} title="Company record">
                  <div className="grid gap-x-10 gap-y-4 py-2 sm:grid-cols-2">
                    {[["OPERATOR", biz.business.brand.fullName], ["MARK", biz.business.brand.name], ["DOMAIN", biz.business.brand.domain], ["FABRICATED", biz.business.createdAt.slice(0, 10)], ["CATALOG SOURCE", biz.business.source === "claude" ? "Claude synthesis" : "Stock catalog"], ["SPEC", biz.business.brand.oneLiner]].map(([k, v]) => (
                      <div key={k}><div style={MICRO}>{k}</div><div className="mt-1 text-pretty text-[13px]" style={{ color: DIMB }}>{v}</div></div>
                    ))}
                  </div>
                </Section>
                <AuditLine measured="policies · company record" awaiting="team accounts · billing" />
              </>
            )}
          </div>
        ) : (
          <div className="px-6 py-10 text-[13px]" style={{ color: DIMB }}>Opening the ledger…</div>
        )}
      </div>
    </main>
  );
}
