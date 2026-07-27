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
  Action, AuditLine, Bar, DIMB, Event, FAINTB, FAULTB, Figure, FigureRow, Funnel, HAIRB, Headline,
  Heads, INKB, INSETB, LIVE, MICRO, MONO, Nothing, Num, OKB, PAPER, Pick, Pulse, Row, SANS,
  Section, Stamp, Thin, WARNB, pad2,
} from "./ledger-ui";

/* ── shapes ────────────────────────────────────────────────────────────── */
type Biz = {
  roster: { slug: string; name: string }[];
  estate: "owned" | "demo";
  business: { slug: string; code: string; createdAt: string; brand: { name: string; fullName: string; domain: string; oneLiner: string; audience?: string; positioning?: string }; catalog: { sku: string; name: string; price: string; priceValue?: number; availability: string; stock: number | null; provenance?: Record<string, string>; kind?: string; unit?: string }[]; manifest: { ships?: string; returns?: string }; source: string };
  traffic: { agents: number; humans: number; byAgent: Record<string, number>; byKind: Record<string, number>; byProduct: Record<string, number>; recent: { ts: string; agent: string; kind: string }[] };
  orders: { count: number; revenue: number; byAgent: Record<string, number>; bySku: Record<string, { qty: number; revenue: number }>; daily: { d: string; revenue: number; orders: number }[]; bySource: Record<string, { orders: number; revenue: number }>; unattributed: { orders: number; revenue: number }; recent: { id: string; ts: string; productName: string; qty: number; price: string; channel: string; agent: string; status: string; paid: boolean; source?: string }[] };
  customers: { email: string; name: string; orders: number; revenue: number; lastTs: string }[];
  activity: { ts: string; worker: string; txt: string; by?: "auto" | "owner" }[];
  finance: {
    revenue: number; settled: number; paidCount: number; outstanding: number; paymentsLive: boolean; paymentsNote: string | null;
    cogs: number; grossProfit: number | null; marginPct: number | null;
    expenses: number; expensesByCategory: Record<string, number>; monthlyRecurringCost: number; expenseCount: number;
    netProfit: number | null; cashFlow: { month: string; inflow: number; outflow: number; net: number }[]; runwayNote: string;
    inventoryAtPrice: number; inventoryAtCost: number | null; recurringRevenue: number; oneOffRevenue: number;
    avgOrderValue: number; costsOnFile: number; skuCount: number; costs: Record<string, number>;
    perSku: { sku: string; name: string; price: string; priceValue: number | null; unitCost: number | null; unitMargin: number | null; marginPct: number | null; sold: number; revenue: number; profit: number | null; recurring: boolean }[];
  };
  automations: { count: number; enabled: number; fired: string[]; held: string[]; metrics: Record<string, number | null> };
  funnel: { stage: string; label: string; n: number }[];
  deliveries: {
    total: number; claimed: number; unclaimed: number; pending: number;
    recent: { token: string; orderId: string; productName: string; kind: string; issuedAt: string; claimedAt: string | null; claims: number }[];
  };
  aftercare: {
    returns: { id: string; orderId: string; reason: string; ts: string; status: string; verdict: string }[];
    questions: { id: string; orderId: string | null; question: string; ts: string; answer: string | null; escalated: boolean }[];
    openReturns: number; escalated: number;
  };
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
type Requirement = { key: string; label: string; status: "met" | "partial" | "unmet"; failing: string[]; fix: string };
type Channel = {
  id: string; name: string; why: string; status: "ready" | "blocked" | "not_applicable";
  artefact: { label: string; path: string } | null; submit: string; requirements: Requirement[];
  snippet?: { label: string; language: string; body: string };
};
type Distribution = {
  robots: { allowed: string[]; blocked: string[] } | null; robotsNote: string | null;
  channels: Channel[]; ready: number;
  blockers: { channel: string; label: string; fix: string; failing: string[] }[];
};

/** Campaign lifecycle, mirrored client-side for the action buttons. */
const CAMPAIGN_NEXT: Record<string, string[]> = { draft: ["live", "ended"], live: ["paused", "ended"], paused: ["live", "ended"], ended: [] };
const CAMPAIGN_C: Record<string, string> = { draft: DIMB, live: OKB, paused: WARNB, ended: FAINTB };
const FLOW_NEXT: Record<string, string[]> = { received: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"], shipped: ["delivered"], delivered: [], cancelled: [] };
const STATUS_C: Record<string, string> = { received: WARNB, confirmed: LIVE, shipped: LIVE, delivered: OKB, cancelled: FAULTB };
const WORKER_C: Record<string, string> = { MARKETING: LIVE, OPERATIONS: OKB, FINANCE: INKB, SYSTEM: DIMB, ORDER: OKB, AGENT: LIVE, VISITOR: FAINTB };

const VIEWS = [
  "DASHBOARD", "MARKETING", "SOCIAL", "OPERATIONS", "FINANCE", "AI COMMERCE",
  "PRODUCTS", "CUSTOMERS", "AFTERCARE", "BRAIN", "AUTOMATION", "EVENTS", "SETTINGS",
] as const;
type View = (typeof VIEWS)[number];
/** Sidebar labels — sentence case, with acronyms preserved. */
const NAV_LABEL: Record<View, string> = {
  DASHBOARD: "Dashboard", MARKETING: "Marketing", SOCIAL: "Social", OPERATIONS: "Operations",
  FINANCE: "Finance", "AI COMMERCE": "Acquisition", PRODUCTS: "Products", CUSTOMERS: "Customers",
  AFTERCARE: "Aftercare", BRAIN: "Business brain", AUTOMATION: "Automation", EVENTS: "Events", SETTINGS: "Settings",
};

/**
 * Thirteen views, each one section deep, read as thirteen shallow things. These
 * five are the business; the rest are the detail behind them. Nothing is
 * removed — every view is still one click away — but the eye is told what
 * actually matters, which is the difference between a product and a menu.
 */
const PRIMARY: readonly View[] = ["DASHBOARD", "AI COMMERCE", "MARKETING", "OPERATIONS", "AFTERCARE"];
const SECONDARY: readonly View[] = VIEWS.filter((v) => !PRIMARY.includes(v));
const TITLES: Record<View, string> = {
  AFTERCARE: "After the sale",
  "AI COMMERCE": "Getting found by agents",
  DASHBOARD: "The business at a glance",
  MARKETING: "Autonomous marketing",
  SOCIAL: "Social presence",
  OPERATIONS: "Operations & fulfilment",
  FINANCE: "Financial intelligence",
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
  const [dist, setDist] = useState<Distribution | null>(null);
  const [openChannel, setOpenChannel] = useState<string | null>(null);
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
  const [care, setCare] = useState<{ returns: Biz["aftercare"]["returns"]; questions: Biz["aftercare"]["questions"] } | null>(null);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
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
    setPreview(null); setMetricNow(null); setOpenRule(null); setOpenSku(null); setCare(null); setAnswerDraft({});
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
  // The aftercare desk pulls its own detail — the dashboard only carries counts.
  useEffect(() => {
    if (view !== "AFTERCARE" || !bslug || care) return;
    let alive = true;
    fetch(`/api/commerce/aftercare?slug=${bslug}`).then((r) => r.json())
      .then((d) => { if (alive && d?.ok) setCare({ returns: d.returns.slice().reverse(), questions: d.questions.slice().reverse() }); })
      .catch(() => {});
    return () => { alive = false; };
  }, [view, bslug, care]);
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
  // Acquisition owns distribution. It reads the live robots.txt, so it is
  // fetched only when the view opens rather than bundled into the business read
  // that every dashboard load already pays for.
  useEffect(() => {
    if (view !== "AI COMMERCE" || !bslug || dist) return;
    let alive = true;
    fetch(`/api/commerce/distribution?slug=${bslug}`).then((r) => r.json())
      .then((d) => { if (alive && d?.ok) setDist(d); }).catch(() => {});
    return () => { alive = false; };
  }, [view, bslug, dist]);

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

  const decideReturn = (returnId: string, status: string) => act(`ret-${returnId}`, async () => {
    const r = await fetch("/api/commerce/aftercare", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, returnId, status }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? "failed");
    setCare({ returns: d.returns.slice().reverse(), questions: d.questions.slice().reverse() });
    pull(slugRef.current);
    return `${returnId} ${status}`;
  });
  const answerAsk = (questionId: string) => act(`ask-${questionId}`, async () => {
    const r = await fetch("/api/commerce/aftercare", {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: bslug, questionId, answer: answerDraft[questionId] ?? "" }),
    });
    const d = await r.json();
    if (!d?.ok) return String(d?.error ?? "failed");
    setCare({ returns: d.returns.slice().reverse(), questions: d.questions.slice().reverse() });
    setAnswerDraft((x) => ({ ...x, [questionId]: "" }));
    pull(slugRef.current);
    return `${questionId} answered`;
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
  const lowStock = biz ? biz.business.catalog.filter((p) => p.stock != null && p.stock <= 3 && p.availability !== "PreOrder").length : 0;
  const agentOrders = biz ? Object.values(biz.orders.byAgent).reduce((a, n) => a + n, 0) : 0;
  const badge: Partial<Record<View, number>> = biz ? {
    MARKETING: biz.proposals.filter((p) => p.worker === "MARKETING" && p.severity !== "ok").length,
    OPERATIONS: pending + lowStock,
    FINANCE: biz.proposals.filter((p) => p.worker === "FINANCE" && p.severity !== "ok").length,
    AUTOMATION: biz.automations.fired.length + biz.automations.held.length,
    AFTERCARE: biz.aftercare.openReturns + biz.aftercare.escalated + biz.deliveries.pending,
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

  /**
   * THE STORY — what actually happened, as sentences rather than cells.
   * Merged from the four places events land: the worker ledger, agent reads,
   * orders and deliveries. Newest first. Nothing here is generated for effect;
   * if a line is present, the event occurred.
   */
  /**
   * THE MARKETING PICTURE — derived on every read, never stored.
   *
   * Each figure traces to something observed: a page render counted, an order
   * that carried a ref back to the surface that sent the buyer, a decision the
   * worker wrote to the log. Revenue is credited only where a ref proves it;
   * the remainder is reported as unexplained rather than spread across
   * campaigns, which is the exact move that makes Advantage+ and PMax
   * unreadable to the people paying for them.
   */
  const mk = (() => {
    const bySource = biz?.orders.bySource ?? {};
    const rows = Object.values(bySource);
    const attributedOrders = rows.reduce((a, s) => a + s.orders, 0);
    const attributedRevenue = Math.round(rows.reduce((a, s) => a + s.revenue, 0));
    const total = biz?.orders.revenue ?? 0;
    const at = (key: string) => ({
      orders: bySource[key]?.orders ?? 0,
      revenue: Math.round(bySource[key]?.revenue ?? 0),
    });
    const surfaces = [
      // A campaign is only a reachable surface once it is live or paused mid-flight.
      ...(campaigns ?? []).filter((c) => c.status === "live" || c.status === "paused").map((c) => ({
        key: `c:${c.id}`, label: c.name, kind: c.status === "live" ? "live" : "paused",
        href: null as string | null,
        // Views are an ad-account number. Absent, not zero — zero would be a claim.
        views: null as number | null,
        ...at(`c:${c.id}`),
      })),
      ...(landings ?? []).map((l) => ({
        key: `l:${l.id}`, label: l.headline, kind: "page",
        href: biz ? `/store/${biz.business.slug}/l/${l.id}` : null,
        views: l.views as number | null,
        ...at(`l:${l.id}`),
      })),
    ].sort((a, b) => b.revenue - a.revenue || (b.views ?? -1) - (a.views ?? -1));
    return {
      attributedOrders, attributedRevenue, surfaces,
      sources: Object.keys(bySource),
      live: (campaigns ?? []).filter((c) => c.status === "live").length,
      pages: landings?.length ?? 0,
      pageViews: (landings ?? []).reduce((a, l) => a + l.views, 0),
      creative: (campaigns ?? []).reduce((a, c) => a + c.variants.length, 0),
      decisions: (biz?.activity ?? []).filter((a) => a.worker === "MARKETING"),
      explainedPct: total > 0 ? Math.round((attributedRevenue / total) * 100) : null,
    };
  })();

  type Beat = { ts: string; time: string; icon: string; tone: string; text: string; note?: string };
  const story: Beat[] = biz
    ? [
        ...biz.activity.map((a) => ({
          ts: a.ts, icon: a.by === "auto" ? "◉" : "○",
          tone: a.by === "auto" ? LIVE : DIMB,
          text: a.txt,
          note: a.by === "auto" ? "unattended" : a.by === "owner" ? "you" : undefined,
        })),
        ...biz.traffic.recent.map((h) => ({
          ts: h.ts, icon: h.agent === "HUMAN" ? "△" : "◈",
          tone: h.agent === "HUMAN" ? FAINTB : LIVE,
          text: h.agent === "HUMAN" ? `A person read your ${h.kind}` : `${h.agent} read your ${h.kind}`,
        })),
        ...biz.orders.recent.map((o) => ({
          ts: o.ts, icon: "€", tone: OKB,
          text: `${o.channel === "agent-json" ? o.agent : "A customer"} bought ${o.productName}${o.qty > 1 ? ` ×${o.qty}` : ""} — ${o.price}`,
          note: o.status !== "received" ? o.status : undefined,
        })),
        ...biz.deliveries.recent.map((d) => ({
          ts: d.claimedAt ?? d.issuedAt,
          icon: d.claimedAt ? "✓" : d.kind === "pending" ? "✗" : "→",
          tone: d.claimedAt ? OKB : d.kind === "pending" ? FAULTB : DIMB,
          text: d.claimedAt
            ? `The buyer opened their ${d.productName}`
            : d.kind === "pending"
              ? `Delivered ${d.productName} with nothing attached`
              : `Delivered ${d.productName} (${d.kind})`,
          note: d.claims > 1 ? `${d.claims} opens` : undefined,
        })),
      ]
        .sort((a, b) => b.ts.localeCompare(a.ts))
        .slice(0, 16)
        .map((e) => ({ ...e, time: e.ts.slice(11, 16) }))
    : [];
  const newestTs = story[0]?.ts;
  const liveNow = Boolean(newestTs && Date.now() - Date.parse(newestTs) < 3600_000);
  const lastEventAgo = newestTs
    ? (() => {
        const mins = Math.round((Date.now() - Date.parse(newestTs)) / 60000);
        return mins < 90 ? `${mins} min ago` : mins < 2880 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
      })()
    : null;
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
            You will only ever see companies you fabricated — an empty register means empty, never somebody else&apos;s business.
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
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span style={MICRO}>REGISTER</span>
            {/* Whose companies these are. A visitor must never mistake the
                built-in examples for their own business. */}
            {biz && <Stamp text={biz.estate === "demo" ? "demo estate" : "your companies"} color={biz.estate === "demo" ? WARNB : LIVE} />}
          </div>
          {biz?.estate === "demo" && (
            <div className="pt-1.5 text-[11.5px] leading-snug" style={{ color: DIMB }}>
              Example businesses, shown because you are not signed in. Sign in and Commerce shows only the companies you fabricated.
            </div>
          )}
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
          {PRIMARY.map((v, i) => (
            <button key={v} onClick={() => setView(v)} className="flex w-full items-baseline gap-2.5 py-[9px] text-left"
              style={{ borderBottom: `1px solid ${HAIRB}` }}>
              <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", color: view === v ? LIVE : FAINTB }}>{pad2(i + 1)}</span>
              <span className="text-[13.5px]" style={{ color: view === v ? INKB : DIMB, fontWeight: view === v ? 700 : 500 }}>
                {NAV_LABEL[v]}
              </span>
              {(badge[v] ?? 0) > 0 && <span className="ml-auto"><Stamp text={String(badge[v])} color={WARNB} filled /></span>}
            </button>
          ))}
          <div className="pt-4" style={MICRO}>THE DETAIL BEHIND IT</div>
          {SECONDARY.map((v) => (
            <button key={v} onClick={() => setView(v)} className="flex w-full items-baseline gap-2.5 py-[5px] text-left">
              <span className="text-[12px]" style={{ color: view === v ? INKB : FAINTB, fontWeight: view === v ? 700 : 400 }}>
                {NAV_LABEL[v]}
              </span>
              {(badge[v] ?? 0) > 0 && <span className="ml-auto"><Stamp text={String(badge[v])} color={WARNB} /></span>}
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
              {PRIMARY.map((v, i) => (
                <button key={v} onClick={() => { setView(v); setNavOpen(false); }}
                  className="flex w-full items-baseline gap-2.5 py-2.5 text-left" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                  <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", color: view === v ? LIVE : FAINTB }}>{pad2(i + 1)}</span>
                  <span className="text-[14.5px]" style={{ color: view === v ? INKB : DIMB, fontWeight: view === v ? 700 : 500 }}>{NAV_LABEL[v]}</span>
                  {(badge[v] ?? 0) > 0 && <span className="ml-auto"><Stamp text={String(badge[v])} color={WARNB} filled /></span>}
                </button>
              ))}
              <div className="pt-4" style={MICRO}>THE DETAIL BEHIND IT</div>
              {SECONDARY.map((v) => (
                <button key={v} onClick={() => { setView(v); setNavOpen(false); }}
                  className="flex w-full items-baseline gap-2.5 py-1.5 text-left">
                  <span className="text-[13px]" style={{ color: view === v ? INKB : FAINTB, fontWeight: view === v ? 700 : 400 }}>{NAV_LABEL[v]}</span>
                  {(badge[v] ?? 0) > 0 && <span className="ml-auto"><Stamp text={String(badge[v])} color={WARNB} /></span>}
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
                {/* ── the answer to "is my business alive, and what happened?" ── */}
                <div className="mt-5 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_320px]" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
                    {/* Booked is what was ordered; settled is what a provider
                        confirmed. Only the second may be called taken — the
                        first is a promise, and printing it as income is the
                        exact dishonesty this product exists to refuse. */}
                    <Headline
                      value={`€${(biz.finance.settled || biz.finance.revenue).toLocaleString("en-US")}`}
                      label={
                        biz.finance.settled > 0
                          ? `TAKEN ACROSS ${biz.finance.paidCount} PAID ORDER${biz.finance.paidCount === 1 ? "" : "S"}`
                          : biz.orders.count
                            ? `BOOKED ACROSS ${biz.orders.count} ORDER${biz.orders.count === 1 ? "" : "S"} · NONE SETTLED`
                            : "NOTHING SOLD YET"
                      }
                      tone={biz.finance.settled > 0 ? OKB : biz.orders.count ? WARNB : FAINTB}
                    />
                    <div className="flex flex-col gap-3">
                      <span className="flex items-center gap-2">
                        <Pulse on={liveNow} color={liveNow ? LIVE : FAINTB} />
                        <span className="text-[13px] font-semibold">
                          {liveNow ? "Working — activity in the last hour" : lastEventAgo ? `Quiet · last activity ${lastEventAgo}` : "Waiting for its first signal"}
                        </span>
                      </span>
                      <span className="text-[12.5px]" style={{ color: DIMB }}>
                        {biz.traffic.agents} agent read{biz.traffic.agents === 1 ? "" : "s"} · {biz.orders.count} order{biz.orders.count === 1 ? "" : "s"}
                        {biz.deliveries.total ? ` · ${biz.deliveries.claimed}/${biz.deliveries.total} deliveries collected` : ""}
                        {biz.finance.marginPct != null ? ` · ${biz.finance.marginPct}% margin` : ""}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {biz.finance.outstanding > 0 && (
                          <Stamp text={`€${biz.finance.outstanding.toLocaleString("en-US")} never collected`} color={WARNB} filled />
                        )}
                        {biz.automations.enabled > 0 && <Stamp text={`${biz.automations.enabled} rule${biz.automations.enabled === 1 ? "" : "s"} armed`} color={LIVE} />}
                        {biz.deliveries.pending > 0 && <Stamp text={`${biz.deliveries.pending} delivery empty`} color={FAULTB} filled />}
                        {biz.aftercare.escalated > 0 && <Stamp text={`${biz.aftercare.escalated} unanswered`} color={FAULTB} filled />}
                      </span>
                    </div>
                  </div>

                  {/* what needs a human, always in the same place */}
                  <div style={{ backgroundColor: alerts ? INSETB : "transparent", padding: alerts ? "14px 16px" : 0 }}>
                    <div style={MICRO}>{alerts ? `${alerts} THING${alerts === 1 ? "" : "S"} NEED YOU` : "NOTHING NEEDS YOU"}</div>
                    {alerts === 0 && <div className="mt-1.5 text-[13px]" style={{ color: DIMB }}>Every worker reports nominal.</div>}
                    <div className="mt-2 flex flex-col gap-2">
                      {biz.proposals.filter((p) => p.severity === "act").slice(0, 4).map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span style={{ color: FAULTB, fontSize: 12, lineHeight: "18px" }}>▸</span>
                          <span className="min-w-0 text-pretty text-[12.5px] leading-snug" style={{ color: INKB }}>{p.label}</span>
                          {p.action && (
                            <button onClick={() => execute(p.action!)} disabled={!!busy}
                              className="shrink-0 text-[11.5px] font-semibold"
                              style={{ color: LIVE, background: "none", border: "none", cursor: "pointer" }}>
                              {busy === p.action ? "…" : "do it"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Section n={1} title="What happened" right={<span style={MICRO}>NEWEST FIRST · EVERY LINE A REAL EVENT</span>}>
                  {story.length === 0 ? (
                    <Nothing
                      title="Nothing has happened here yet."
                      why="This fills the moment an AI agent reads your store or anyone buys. Nothing is simulated — if the line is not here, it did not happen. The fastest way to see it work is to submit your product feed so agents can find you, or open the store and place an order yourself."
                      action={<>
                        <a href={`/store/${biz.business.slug}`} target="_blank" rel="noreferrer" className="text-[12px] font-semibold no-underline" style={{ color: LIVE }}>open the store ↗</a>
                        <a href={`/store/${biz.business.slug}/feed.tsv`} target="_blank" rel="noreferrer" className="text-[12px] font-semibold no-underline" style={{ color: LIVE }}>the feed to submit ↗</a>
                      </>}
                    />
                  ) : story.map((e, i) => (
                    <Event key={i} time={e.time} icon={e.icon} tone={e.tone} note={e.note}>{e.text}</Event>
                  ))}
                </Section>

                <Section n={2} title="The journey" right={<span style={MICRO}>WHERE AGENTS ARRIVE, AND WHERE THEY STOP</span>}>
                  <Funnel stages={biz.funnel} />
                  <div className="pt-3 text-[12.5px] leading-relaxed" style={{ color: DIMB }}>
                    {biz.funnel[0].n === 0
                      ? "No agent has reached a discovery surface yet. Until the feed is submitted or the store is linked somewhere an agent crawls, the journey cannot start — this is the number to move first."
                      : biz.orders.count === 0
                        ? "Agents are reading but not buying. The usual causes are a price an agent cannot parse, a checkout it cannot complete, or a catalogue too thin to win a comparison."
                        : biz.funnel[1].n === 0
                          ? `${biz.orders.count} order${biz.orders.count === 1 ? "" : "s"} came straight through the machine layer — the agent bought from the catalogue or the MCP tools without ever loading a page. That is the agent-native path working.`
                          : biz.orders.count > biz.funnel[1].n
                            // More orders than page reads is not an error: an agent
                            // can buy straight off the feed or over MCP without ever
                            // rendering a page. "2 of 1 reads" would look like a bug.
                            ? `${biz.orders.count} orders against ${biz.funnel[1].n} page read${biz.funnel[1].n === 1 ? "" : "s"} — some buyers never opened a page at all, which is exactly what buying over the machine layer looks like.`
                            : `${biz.orders.count} of ${biz.funnel[1].n} page reads became orders. Every stage above is counted from real requests to this store.`}
                  </div>
                </Section>

                <Section n={3} title="The money" right={<span style={MICRO}>{biz.finance.costsOnFile}/{biz.finance.skuCount} SKUS COSTED</span>}>
                  <FigureRow cols={6}>
                    <Figure label="BOOKED" value={`€${biz.finance.revenue.toLocaleString("en-US")}`} color={biz.finance.revenue ? INKB : FAINTB} note={`avg order €${biz.finance.avgOrderValue}`} />
                    <Figure label="SETTLED" value={`€${biz.finance.settled.toLocaleString("en-US")}`} color={biz.finance.settled ? OKB : FAULTB} note={biz.finance.settled ? `${biz.finance.paidCount} paid` : "no money has moved"} />
                    <Figure label="MARGIN" value={biz.finance.marginPct != null ? `${biz.finance.marginPct}%` : "—"} color={biz.finance.marginPct != null ? OKB : FAINTB} note={biz.finance.marginPct == null ? "needs unit costs" : `COGS €${biz.finance.cogs}`} />
                    <Figure label="CUSTOMERS" value={biz.customers.length} note={`${biz.customers.filter((c) => c.orders > 1).length} repeat`} />
                    <Figure label="AGENT READS" value={biz.traffic.agents} color={biz.traffic.agents ? LIVE : FAINTB} note={`${biz.traffic.humans} human`} />
                    <Figure label="STOCK VALUE" value={`€${biz.finance.inventoryAtPrice.toLocaleString("en-US")}`} note={`${biz.business.catalog.reduce((a, p) => a + (p.stock ?? 0), 0)} units`} />
                  </FigureRow>
                  {biz.orders.daily.length > 0 && (
                    <div className="mt-4 flex items-end gap-4 px-1 py-4" style={{ height: 140, backgroundColor: INSETB }}>
                      {biz.orders.daily.map((d) => (
                        <div key={d.d} className="flex flex-1 flex-col items-center justify-end gap-1.5" title={`${d.d} · €${d.revenue} · ${d.orders} orders`}>
                          <Num color={OKB} bold>€{d.revenue}</Num>
                          <div className="w-full max-w-[52px]" style={{ height: Math.max(4, (d.revenue / maxDay) * 82), backgroundColor: OKB }} />
                          <Num color={FAINTB}>{d.d.slice(5)}</Num>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Section n={4} title="Situation" right={<Action onClick={analyseNow} disabled={!!busy}>{busy === "analyse" ? "READING…" : "◉ ANALYSE"}</Action>}>
                  {analysis ? (
                    <>
                      <div className="flex flex-wrap items-center gap-3 pb-2">
                        <Stamp text={analysis.posture} color={analysis.posture === "GROW" ? OKB : analysis.posture === "FIX" ? FAULTB : WARNB} filled />
                        <span className="text-pretty text-[14px] font-semibold">{analysis.headline}</span>
                      </div>
                      {analysis.findings.map((f, i) => (
                        <Row key={i}>
                          <Num color={LIVE}>{pad2(i + 1)}</Num>
                          <span className="w-[190px] shrink-0 text-[12.5px] font-semibold">{f.signal}</span>
                          <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{f.insight}</span>
                        </Row>
                      ))}
                    </>
                  ) : (
                    <Nothing
                      title="No reading taken yet."
                      why="ANALYSE has Claude read everything measured above — traffic, orders, margin, stock — and state a posture with the evidence behind it. It never invents a number; when there is nothing to go on, it says so."
                    />
                  )}
                </Section>

                <AuditLine measured="every event above · orders · revenue · agent reads · deliveries · margin where costed" awaiting="ad accounts · payment rails" />
              </>
            )}

            {/* ══════════ 02 MARKETING ══════════ */}
            {view === "MARKETING" && (
              <>
                {/* ── What marketing is worth. Meta's Advantage+ and Google's
                    PMax return spend and attributed revenue and nothing else;
                    the whole complaint against them is that you cannot see
                    which surface did the work. So that is the number we lead
                    with — and when it cannot be known, we say which surface is
                    missing a ref rather than dividing revenue by vibes. ── */}
                <div className="mt-5 grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_300px]" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
                    <Headline
                      value={`€${mk.attributedRevenue.toLocaleString("en-US")}`}
                      label={mk.attributedOrders ? `EARNED BY ${mk.sources.length} MARKETING SURFACE${mk.sources.length === 1 ? "" : "S"}` : "NOTHING TRACEABLE TO MARKETING YET"}
                      tone={mk.attributedRevenue ? OKB : FAINTB}
                    />
                    <div className="flex flex-col gap-3">
                      <span className="flex items-center gap-2">
                        <Pulse on={mk.live > 0} color={mk.live > 0 ? LIVE : FAINTB} />
                        <span className="text-[13px] font-semibold">
                          {mk.live > 0
                            ? `${mk.live} campaign${mk.live === 1 ? "" : "s"} live · ${mk.pages} page${mk.pages === 1 ? "" : "s"} reachable`
                            : mk.pages > 0
                              ? `Nothing live — ${mk.pages} page${mk.pages === 1 ? " is" : "s are"} published and reachable`
                              : "Nothing in market"}
                        </span>
                      </span>
                      <span className="text-[12.5px]" style={{ color: DIMB }}>
                        {mk.creative} creative{mk.creative === 1 ? "" : "s"} written · {mk.pageViews} page view{mk.pageViews === 1 ? "" : "s"} · {mk.decisions.length} logged decision{mk.decisions.length === 1 ? "" : "s"}
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        {biz.orders.unattributed.orders > 0 && (
                          <Stamp text={`€${biz.orders.unattributed.revenue.toLocaleString("en-US")} arrived with no ref`} color={WARNB} />
                        )}
                        {!biz.brain?.visual && <Stamp text="no visual world" color={FAULTB} filled />}
                        {(biz.brain?.counts.company ?? 0) === 0 && <Stamp text="no company rules" color={FAULTB} filled />}
                      </span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: INSETB, padding: "14px 16px" }}>
                    <div style={MICRO}>HOW MUCH OF THE REVENUE IS EXPLAINED</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: mk.explainedPct == null ? FAINTB : mk.explainedPct >= 50 ? OKB : WARNB }}>
                        {mk.explainedPct == null ? "—" : `${mk.explainedPct}%`}
                      </span>
                      <Bar pct={mk.explainedPct ?? 0} color={mk.explainedPct != null && mk.explainedPct >= 50 ? OKB : WARNB} width={110} />
                    </div>
                    <div className="mt-2 text-pretty text-[12px] leading-snug" style={{ color: DIMB }}>
                      {mk.explainedPct == null
                        ? "No revenue yet, so there is nothing to explain. Every order that arrives through a landing page carries a ref and lands in the table below."
                        : mk.explainedPct === 100
                          ? "Every euro traces to the surface that sent the buyer."
                          : `The rest arrived direct or through a link with no ref. It is counted as revenue, never credited to a campaign that cannot prove it.`}
                    </div>
                  </div>
                </div>

                {/* ── §01 the anti-black-box: every decision, with evidence ── */}
                <Section n={1} title="What marketing did" right={<span style={MICRO}>EVERY DECISION · WHO MADE IT · NEWEST FIRST</span>}>
                  {mk.decisions.length === 0 ? (
                    <Nothing
                      title="The marketing worker has not done anything yet."
                      why="Every action it takes is logged here with the evidence behind it and whether it ran unattended or you asked for it. This is deliberately the first thing on the page: an ad platform that optimises without telling you what it changed is the thing PDR is built not to be."
                    />
                  ) : mk.decisions.map((a, i) => (
                    <Event key={i} time={a.ts.slice(11, 16)} icon={a.by === "auto" ? "◉" : "○"} tone={a.by === "auto" ? LIVE : DIMB}
                      note={a.by === "auto" ? "unattended" : "you"}>
                      {a.txt}
                    </Event>
                  ))}
                </Section>

                {/* ── §02 what is in market, and what each surface earned ── */}
                <Section n={2} title="In market" right={
                  <span className="flex items-center gap-2">
                    <span style={MICRO}>{campaigns ? `${campaigns.length} CAMPAIGN${campaigns.length === 1 ? "" : "S"} · ${mk.live} LIVE` : "LOADING…"}</span>
                    <Action onClick={() => writeLanding(null, null)} disabled={!!busy}>{busy === "landing" ? "WRITING…" : "+ LANDING PAGE"}</Action>
                  </span>
                }>
                  {mk.surfaces.length === 0 ? (
                    <Nothing
                      title="Nothing is in market."
                      why="A surface is anything a buyer can actually reach: a live campaign or a published landing page. Until one exists, marketing has produced words and no doors. Write a page above, or draft a campaign in the workshop below."
                    />
                  ) : (
                    <>
                      <Heads cols="minmax(0,1fr) 92px 78px 74px 92px" labels={["SURFACE", "KIND", "VIEWS", "ORDERS", "EARNED"]} />
                      {mk.surfaces.map((s) => (
                        <Row key={s.key} cols="minmax(0,1fr) 92px 78px 74px 92px">
                          {s.href ? (
                            <a href={s.href} target="_blank" rel="noreferrer" className="truncate text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>
                              {s.label} <span style={{ color: LIVE }}>↗</span>
                            </a>
                          ) : (
                            <span className="truncate text-[13.5px] font-semibold">{s.label}</span>
                          )}
                          <Stamp text={s.kind} color={s.kind === "live" ? OKB : s.kind === "page" ? LIVE : DIMB} filled={s.kind === "live"} />
                          <Num color={s.views == null ? FAINTB : s.views ? INKB : FAINTB}>{s.views == null ? "n/a" : s.views}</Num>
                          <Num color={s.orders ? OKB : FAINTB}>{s.orders}</Num>
                          <Num color={s.revenue ? OKB : FAINTB} bold={!!s.revenue}>{s.revenue ? `€${s.revenue.toLocaleString("en-US")}` : "—"}</Num>
                        </Row>
                      ))}
                      <div className="pt-3 text-[12.5px] leading-relaxed" style={{ color: DIMB }}>
                        {mk.attributedOrders === 0
                          ? "Views are counted from real renders. No order has carried a ref yet, so no surface can claim revenue — every landing page CTA now stamps one, so the first sale through a page will appear on its row."
                          : `${mk.attributedOrders} order${mk.attributedOrders === 1 ? "" : "s"} carried a ref back to the surface that sent the buyer. A campaign shows n/a views until an ad account is connected — Commerce will not render an impression it did not observe.`}
                      </div>
                    </>
                  )}
                </Section>

                {/* ── §03 campaigns in detail: the creative and its experiments ── */}
                <Section n={3} title="Campaigns" right={
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Campaign name"
                      className="h-8 w-[150px] px-2.5 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <input value={cObjective} onChange={(e) => setCObjective(e.target.value)} placeholder="Objective — sell 40 sets before December"
                      className="h-8 w-[240px] px-2.5 text-[12.5px]" style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <input value={cBudget} onChange={(e) => setCBudget(e.target.value)} placeholder="cap €/mo"
                      className="h-8 w-[84px] px-2 text-[12.5px] tabular-nums" style={{ fontFamily: MONO, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                    <Action onClick={createCampaign} disabled={!!busy || !cName.trim() || !cObjective.trim() || cChannels.length === 0}>
                      {busy === "campaign" ? "DRAFTING…" : "DRAFT"}
                    </Action>
                  </div>
                }>
                  <div className="flex flex-wrap items-center gap-1.5 pb-3">
                    <span style={MICRO}>CHANNELS</span>
                    {["INSTAGRAM", "LINKEDIN", "TIKTOK", "X", "META", "EMAIL"].map((ch) => (
                      <Pick key={ch} onClick={() => setCChannels((s) => s.includes(ch) ? s.filter((x) => x !== ch) : [...s, ch])} active={cChannels.includes(ch)}>
                        {ch.charAt(0) + ch.slice(1).toLowerCase()}
                      </Pick>
                    ))}
                  </div>

                  {campaigns?.length === 0 && <Nothing
                      title="No campaigns yet."
                      why="A campaign is a durable objective that owns its creative. Name one above and the Marketing worker writes variants through the brain, each grounded in a real product at its real price and told to differ from its siblings. Performance stays empty until a channel is connected — Commerce will not invent a click."
                    />}
                  {(campaigns ?? []).map((c) => {
                    const open = openCampaign === c.id;
                    const winner = c.variants.find((v) => v.winner);
                    const earned = biz.orders.bySource[`c:${c.id}`];
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
                          {earned && <Stamp text={`€${earned.revenue} earned`} color={OKB} filled />}
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
                            {c.variants.length === 0 && (
                              <Nothing
                                title="No creative in this campaign."
                                why="Each variant is written through every brain rule — the core craft rules, this company's own guidelines, anything you taught it, and anything it learned from measured outcomes — then told explicitly to differ from its siblings so the test is a real test."
                              />
                            )}
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
                                        {/* No data to judge on ⇒ say so on the control itself. */}
                                        <Pick onClick={() => variantAction(c.id, v.id, "winner")} disabled={!!busy} active={!v.winner}>
                                          {v.impressions == null ? "Lead · by taste" : "Winner"}
                                        </Pick>
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

                {/* ── §04 landing pages, each with what it actually earned ── */}
                <Section n={4} title="Pages" right={
                  <span className="flex items-center gap-2">
                    <span style={MICRO}>{landings ? `${landings.length} PUBLISHED · ${mk.pageViews} VIEW${mk.pageViews === 1 ? "" : "S"} MEASURED` : "LOADING…"}</span>
                    <Action onClick={() => writeLanding(null, null)} disabled={!!busy}>{busy === "landing" ? "WRITING…" : "WRITE A PAGE"}</Action>
                  </span>
                }>
                  {landings?.length === 0 && <Nothing
                      title="No landing pages yet."
                      why="A landing page argues for one product to one audience — a catalogue asks people to browse, a page asks them to buy. It is served by the store as complete HTML with Product and Offer data embedded, so an agent following an ad link reads exactly what a person does. Every CTA carries a ref, which is how the row above learns what the page earned."
                    />}
                  {(landings ?? []).map((l) => {
                    const earned = biz.orders.bySource[`l:${l.id}`];
                    return (
                      <div key={l.id} className="py-3" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <Stamp text={l.id} color={LIVE} />
                          <a href={`/store/${biz.business.slug}/l/${l.id}`} target="_blank" rel="noreferrer" className="min-w-0 text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>
                            {l.headline} <span style={{ color: LIVE }}>↗</span>
                          </a>
                          {l.campaignId && <Stamp text={l.campaignId} color={DIMB} />}
                          {l.sku && <span style={MICRO}>{l.sku}</span>}
                          <span className="ml-auto flex items-center gap-3">
                            <span style={MICRO}>{l.views} VIEW{l.views === 1 ? "" : "S"}</span>
                            {earned
                              ? <Stamp text={`${earned.orders} order${earned.orders === 1 ? "" : "s"} · €${earned.revenue}`} color={OKB} filled />
                              : <Stamp text={l.views ? "no sale yet" : "unseen"} color={l.views ? WARNB : FAINTB} />}
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
                    );
                  })}
                </Section>

                {/* ── §05 the workshop: where creative gets made ── */}
                <Section n={5} title="The workshop" right={
                  <div className="flex flex-wrap gap-1.5">{["LINKEDIN", "X", "INSTAGRAM", "TIKTOK"].map((pf) => (
                    <Pick key={pf} onClick={() => generateDraft(pf)} active={draftPf === pf} disabled={!!busy}>
                      {busy === `draft-${pf}` ? "…" : pf.charAt(0) + pf.slice(1).toLowerCase()}
                    </Pick>
                  ))}</div>}>
                  {draft ? (
                    <div className="whitespace-pre-wrap p-4 text-[13.5px] leading-relaxed" style={{ backgroundColor: INSETB, color: INKB }}>{draft}</div>
                  ) : (
                    <Nothing
                      title="Nothing on the bench."
                      why="Pick a channel and the worker writes one piece through every brain rule, selling a real product at its exact price. This is the scratchpad — copy that should live somewhere permanent belongs in a campaign or a page."
                    />
                  )}
                  <div className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2" style={{ borderTop: `1px solid ${HAIRB}`, paddingTop: 12 }}>
                    <div>
                      <div style={MICRO}>WHAT IT WRITES THROUGH</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Stamp text={`${biz.brain?.counts.core ?? 0} craft`} color={DIMB} />
                        <Stamp text={`${biz.brain?.counts.company ?? 0} this company`} color={(biz.brain?.counts.company ?? 0) ? OKB : FAULTB} filled={(biz.brain?.counts.company ?? 0) === 0} />
                        <Stamp text={`${biz.brain?.counts.taught ?? 0} taught`} color={DIMB} />
                        <Stamp text={`${biz.brain?.counts.learned ?? 0} learned`} color={(biz.brain?.counts.learned ?? 0) ? LIVE : FAINTB} />
                      </div>
                      <div className="mt-2 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>
                        {(biz.brain?.counts.company ?? 0) === 0
                          ? "This business has only the generic craft rules. Nothing it writes will sound like it and no video will look like it until its own guidelines are seeded — the queue at the top offers that."
                          : "Every draft, variant and page is written through all four layers."}
                      </div>
                    </div>
                    <div>
                      <div style={MICRO}>VIDEO</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Stamp text={biz.brain?.visual ? "visual world set" : "no visual world"} color={biz.brain?.visual ? OKB : FAULTB} filled={!biz.brain?.visual} />
                        <Stamp text="renderer awaiting key" color={WARNB} />
                      </div>
                      <div className="mt-2 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>
                        {biz.brain?.visual
                          ? `Shot in: ${biz.brain.visual.setting}. Every cut inherits that world, so two ads a month apart still look like the same company.`
                          : "A visual world is the one look every video for this business is shot in — setting, light, materials, camera language, and what must never appear. Without it, rendered footage would be handsome and anonymous."}
                      </div>
                    </div>
                  </div>
                </Section>

                {/* ── §06 what it learned, and what it cannot yet know ── */}
                <Section n={6} title="What it learned" right={<span style={MICRO}>DISTILLED FROM MEASURED OUTCOMES ONLY</span>}>
                  {!biz.brain || biz.brain.learned.length === 0 ? <Nothing
                      title="Nothing learned yet."
                      why="The brain only draws conclusions from measured outcomes — real agent reads and real orders. With too little signal it refuses to conclude rather than inventing a pattern, which is why this is empty on a young business."
                    />
                    : biz.brain.learned.map((r) => (
                      <Row key={r.k}>
                        <Stamp text={`${r.k} ${r.kind === "do" ? "do" : "don't"}`} color={LIVE} />
                        <span className="min-w-0 flex-1 text-pretty text-[13px]" style={{ color: DIMB }}>{r.txt}</span>
                      </Row>
                    ))}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ borderTop: `1px solid ${HAIRB}`, paddingTop: 12 }}>
                    <Stamp text="not measurable here" color={WARNB} filled />
                    <span className="min-w-0 flex-1 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>
                      ROAS, CAC, CTR and spend need an ad account (Meta · Google · TikTok). They stay absent rather than estimated —
                      the platforms that do estimate them are the reason nobody can tell which of their creatives worked.
                    </span>
                  </div>
                </Section>

                <AuditLine
                  measured="every marketing decision and who made it · page views from real renders · orders and revenue credited only where the buyer carried a ref"
                  awaiting="ad accounts for spend and reach · a Higgsfield key for rendered video"
                />
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
                <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-6" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <Headline value={pending} label={pending ? "ORDERS AWAITING YOUR CONFIRMATION" : "NOTHING WAITING ON YOU"} tone={pending ? WARNB : OKB} />
                  <div className="flex flex-col gap-2 text-[13px]" style={{ color: DIMB }}>
                    <span>{biz.orders.count} order{biz.orders.count === 1 ? "" : "s"} taken · {biz.customers.length} customer{biz.customers.length === 1 ? "" : "s"}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {lowStock > 0 && <Stamp text={`${lowStock} SKU low or out`} color={WARNB} filled />}
                      {agentOrders > 0 && <Stamp text={`${agentOrders} bought by agents`} color={LIVE} />}
                    </span>
                  </div>
                </div>
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
                    const lvl = p.stock === 0 ? FAULTB : (p.stock ?? 99) <= 3 ? WARNB : OKB;
                    return (
                      <Row key={p.sku} cols="minmax(0,1fr) 84px 140px 72px auto">
                        <a href={`/store/${biz.business.slug}/p/${p.sku}`} target="_blank" rel="noreferrer" className="truncate text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>{p.name}</a>
                        <Num color={DIMB}>{p.price}</Num>
                        <Bar pct={Math.min(100, ((p.stock ?? 0) / 24) * 100)} color={lvl} />
                        <Num color={p.stock === 0 ? FAULTB : DIMB} bold>{p.stock == null ? "—" : p.availability === "PreOrder" ? "PRE" : p.stock === 0 ? "OUT" : `${p.stock}u`}</Num>
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
                <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-6" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <Headline
                    value={biz.finance.netProfit != null ? `€${biz.finance.netProfit.toLocaleString("en-US")}` : "—"}
                    label={biz.finance.netProfit != null ? "NET PROFIT · REVENUE LESS COGS AND EXPENSES" : "NET PROFIT — NOT KNOWABLE YET"}
                    tone={biz.finance.netProfit == null ? FAINTB : biz.finance.netProfit >= 0 ? OKB : FAULTB}
                  />
                  <div className="max-w-[46ch] text-[13px] leading-relaxed" style={{ color: DIMB }}>
                    {biz.finance.netProfit == null
                      ? `Revenue is measured (€${biz.finance.revenue}). Net profit needs a unit cost on every sellable — ${biz.finance.costsOnFile}/${biz.finance.skuCount} are on file — and your operating expenses. Commerce will not estimate either.`
                      : `€${biz.finance.revenue} revenue less €${biz.finance.cogs} COGS and €${biz.finance.expenses} expenses. Every figure traces to an order id or an entry you made.`}
                  </div>
                </div>
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
                  {expenses?.length === 0 && <Nothing
                      title="No expenses recorded."
                      why="Revenue and COGS are measured for you. Operating costs are the one thing only you know — rent, ads, software, your own time. Record them above and net profit and the cash-flow series become real instead of withheld."
                    />}
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
                {/* Being legible is not the same as being listed. The audit
                    answers "can an agent read you"; this answers "are you in
                    the catalogues agents are sent to", which is what decides
                    whether anybody arrives at all. */}
                <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-6" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <Headline
                    value={dist ? dist.ready : "—"}
                    unit={dist ? `/ ${dist.channels.length}` : undefined}
                    label="AGENT CHANNELS READY TO SUBMIT"
                    tone={!dist ? FAINTB : dist.ready === dist.channels.length ? OKB : dist.ready ? WARNB : FAULTB}
                  />
                  <div className="flex max-w-[52ch] flex-col gap-2">
                    <span className="text-[13px]" style={{ color: DIMB }}>
                      {!dist
                        ? "Checking every channel against its own published requirements."
                        : dist.blockers.length === 0
                          ? "Nothing in the catalogue is blocking a submission. What is left is the step only you can take: every one of these needs an account in your name."
                          : `${dist.blockers.length} requirement${dist.blockers.length === 1 ? "" : "s"} must be fixed before this store can be submitted everywhere.`}
                    </span>
                    {dist?.robotsNote && <Stamp text={dist.robotsNote} color={WARNB} filled />}
                    {dist?.robots && (
                      <span className="flex flex-wrap gap-1.5">
                        <Stamp text={`${dist.robots.allowed.length} agents allowed`} color={OKB} />
                        {dist.robots.blocked.length > 0 && <Stamp text={`${dist.robots.blocked.length} blocked`} color={FAULTB} filled />}
                      </span>
                    )}
                  </div>
                </div>

                <Section n={1} title="Where agents shop" right={<span style={MICRO}>EACH CHANNEL AGAINST ITS OWN SPEC</span>}>
                  {!dist ? <Thin>Reading robots.txt and validating the catalogue against every requirement each channel publishes.</Thin>
                    : dist.channels.map((c) => {
                      const open = openChannel === c.id;
                      const unmet = c.requirements.filter((r) => r.status !== "met");
                      return (
                        <div key={c.id} style={{ borderBottom: `1px solid ${HAIRB}` }}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 py-3">
                            <Stamp
                              text={c.status === "not_applicable" ? "n/a" : c.status}
                              color={c.status === "ready" ? OKB : c.status === "blocked" ? FAULTB : FAINTB}
                              filled={c.status === "blocked"}
                            />
                            <button onClick={() => setOpenChannel(open ? null : c.id)} className="min-w-0 text-left">
                              <span className="text-[13.5px] font-semibold">{c.name}</span>
                            </button>
                            {unmet.length > 0 && <Stamp text={`${unmet.length} to fix`} color={WARNB} />}
                            <span className="ml-auto flex flex-wrap items-center gap-2">
                              {c.artefact && (
                                <a href={c.artefact.path} target="_blank" rel="noreferrer" className="text-[12px] font-semibold no-underline" style={{ color: LIVE }}>
                                  {c.artefact.label} ↗
                                </a>
                              )}
                              <Pick onClick={() => setOpenChannel(open ? null : c.id)} active={open}>{open ? "Hide" : "How to submit"}</Pick>
                            </span>
                          </div>
                          <div className="px-1 pb-3 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>{c.why}</div>
                          {open && (
                            <div className="px-1 pb-4">
                              <div className="p-3 text-[12.5px] leading-relaxed" style={{ backgroundColor: INSETB }}>
                                <span style={MICRO}>THE LAST STEP IS YOURS</span>
                                <div className="mt-1.5">{c.submit}</div>
                              </div>
                              {c.snippet && (
                                <>
                                  <div className="mt-3" style={MICRO}>{c.snippet.label}</div>
                                  <pre className="mt-1.5 overflow-x-auto p-3 text-[11.5px] leading-[1.6]"
                                    style={{ backgroundColor: INSETB, fontFamily: MONO, color: INKB }}>{c.snippet.body}</pre>
                                </>
                              )}
                              <div className="mt-3">
                                <Heads cols="minmax(0,1fr) 78px" labels={["REQUIREMENT", "STATUS"]} />
                                {c.requirements.map((r) => (
                                  <div key={r.key} className="py-2" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                                    <div className="grid gap-x-3" style={{ gridTemplateColumns: "minmax(0,1fr) 78px" }}>
                                      <span className="text-[13px] font-semibold">{r.label}</span>
                                      <Stamp text={r.status} color={r.status === "met" ? OKB : r.status === "partial" ? WARNB : FAULTB} filled={r.status === "unmet"} />
                                    </div>
                                    {r.status !== "met" && (
                                      <div className="mt-1 text-pretty text-[12.5px] leading-snug" style={{ color: DIMB }}>
                                        {r.fix}
                                        {r.failing.length > 0 && r.failing.length <= 8 && (
                                          <span style={{ color: FAULTB }}> — {r.failing.join(", ")}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </Section>

                <Section n={2} title="The agent funnel" right={<span style={MICRO}>DISCOVERY → RETRIEVAL → PURCHASE</span>}>
                  <FigureRow cols={5}>
                    <Figure label="AGENT CRAWLS" value={biz.traffic.agents} color={LIVE} />
                    <Figure label="PRODUCT RETRIEVALS" value={biz.traffic.byKind["product"] ?? 0} color={LIVE} />
                    <Figure label="FEED PULLS" value={biz.traffic.byKind["feed"] ?? 0} color={LIVE} />
                    <Figure label="AGENT ORDERS" value={agentOrders} color={OKB} />
                    <Figure label="READ → ORDER" value={biz.traffic.agents ? `${Math.round((agentOrders / biz.traffic.agents) * 100)}%` : "—"} />
                  </FigureRow>
                </Section>
                <Section n={3} title="Who reads the store">
                  {Object.keys(biz.traffic.byAgent).length === 0 ? (
                    <Nothing
                      title="No AI agent has read this store yet."
                      why="Agents arrive through discovery surfaces: a submitted product feed, a crawled sitemap, or a link somewhere they already look. Until one does, this funnel cannot start — and it is the number worth moving before any other."
                    />
                  ) : (
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
                <Section n={4} title="Readiness" right={<Action onClick={runReadiness} disabled={!!busy}>{busy === "report" ? "CRAWLING…" : "RUN CHECK"}</Action>}>
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
                <Section n={5} title="Visibility — what agents actually retrieve">
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
                <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-6" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <Headline value={biz.business.catalog.filter((p) => p.availability !== "Discontinued").length} label="SELLABLES ON THE SHELF" tone={INKB} />
                  <div className="flex flex-col gap-2 text-[13px]" style={{ color: DIMB }}>
                    <span>€{biz.finance.inventoryAtPrice.toLocaleString("en-US")} at price · {biz.finance.costsOnFile}/{biz.finance.skuCount} costed</span>
                    <span className="flex flex-wrap gap-1.5">
                      {biz.business.catalog.filter((p) => !p.provenance?.material && !p.provenance?.origin && p.availability !== "Discontinued").length > 0 &&
                        <Stamp text={`${biz.business.catalog.filter((p) => !p.provenance?.material && !p.provenance?.origin && p.availability !== "Discontinued").length} without provenance`} color={WARNB} />}
                      {biz.business.catalog.filter((p) => (biz.traffic.byProduct[p.sku] ?? 0) === 0).length > 0 &&
                        <Stamp text={`${biz.business.catalog.filter((p) => (biz.traffic.byProduct[p.sku] ?? 0) === 0).length} never read by an agent`} color={FAINTB} />}
                    </span>
                  </div>
                </div>
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
                            {p.stock == null ? "—" : `${p.stock}u`}
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
                            {!retired && p.stock != null && p.stock <= 3 && p.availability !== "PreOrder" && <Stamp text={p.stock === 0 ? "out of stock" : "low stock"} color={p.stock === 0 ? FAULTB : WARNB} />}
                            {!retired && sold === 0 && reads > 0 && <Stamp text="read, never bought" color={LIVE} />}
                            <Pick onClick={() => { setOpenSku(open ? null : p.sku); setEPrice(p.price.replace(/^€/, "").replace(/\/(mo|yr)$/, "")); setEStock(p.stock == null ? "" : String(p.stock)); setEKind(p.kind ?? "good"); setEUnit(p.unit ?? "item"); setProv({ ...(p.provenance ?? {}) } as Record<string, string>); }} active={open}>
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
                <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-6" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <Headline value={biz.customers.length} label={biz.customers.length === 1 ? "CUSTOMER ON THE BOOK" : "CUSTOMERS ON THE BOOK"} tone={biz.customers.length ? INKB : FAINTB} />
                  <div className="text-[13px]" style={{ color: DIMB }}>
                    {biz.customers.length === 0
                      ? "One row appears per buyer, from real orders."
                      : `${biz.customers.filter((c) => c.orders > 1).length} have bought more than once · €${Math.round(biz.customers.reduce((a, c) => a + c.revenue, 0) / biz.customers.length)} average lifetime value`}
                  </div>
                </div>
                <Section n={1} title="The book" right={
                  <span style={MICRO}>
                    AVG LTV €{biz.customers.length ? Math.round(biz.customers.reduce((a, c) => a + c.revenue, 0) / biz.customers.length) : 0} ·
                    REPEAT {biz.customers.length ? Math.round((biz.customers.filter((c) => c.orders > 1).length / biz.customers.length) * 100) : 0}%
                  </span>
                }>
                  <Heads cols="160px minmax(0,1fr) 90px 76px 90px" labels={["CUSTOMER", "EMAIL", "ORDERS", "SEGMENT", "LTV"]} />
                  {biz.customers.length === 0 && <Nothing
                      title="No customers yet."
                      why="This book fills from real orders — one row per buyer, with lifetime value and repeat rate counted, never estimated. Agent purchases appear here alongside human ones."
                    />}
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
                  {autos?.length === 0 && <Nothing
                      title="Nothing armed — the OS will not act on its own until you say so."
                      why="A rule is a measured condition and an ordered plan. Arm one above, then press DRY RUN: it tells you exactly what would fire and why, without touching anything. Set a rule to hold for approval and it will state its plan and wait for you rather than act."
                    />}
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
                  {ledger.length === 0 && <Nothing
                      title="The book is empty."
                      why="Every agent read, order, worker action and delivery lands here in order, newest first. It fills the moment anything happens — and if a line is not here, it did not happen."
                    />}
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

            {/* ══════════ 12 AFTERCARE ══════════ */}
            {view === "AFTERCARE" && (
              <>
                <div className="mt-5 flex flex-wrap items-end gap-x-12 gap-y-6" style={{ borderTop: `2px solid ${INKB}`, paddingTop: 18 }}>
                  <Headline
                    value={biz.deliveries.claimed}
                    unit={`/ ${biz.deliveries.total}`}
                    label="DELIVERIES COLLECTED"
                    tone={biz.deliveries.total === 0 ? FAINTB : biz.deliveries.claimed === biz.deliveries.total ? OKB : WARNB}
                  />
                  <div className="flex flex-col gap-2">
                    <span className="text-[13px]" style={{ color: DIMB }}>
                      {biz.deliveries.total === 0
                        ? "Nothing has been delivered yet."
                        : biz.deliveries.unclaimed > 0
                          ? `${biz.deliveries.unclaimed} buyer(s) paid and never opened what they bought — the link may not have reached them.`
                          : "Every buyer opened what they bought."}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {biz.deliveries.pending > 0 && <Stamp text={`${biz.deliveries.pending} delivered empty`} color={FAULTB} filled />}
                      {biz.aftercare.openReturns > 0 && <Stamp text={`${biz.aftercare.openReturns} return${biz.aftercare.openReturns === 1 ? "" : "s"} waiting`} color={WARNB} filled />}
                      {biz.aftercare.escalated > 0 && <Stamp text={`${biz.aftercare.escalated} unanswered`} color={FAULTB} filled />}
                    </span>
                  </div>
                </div>

                <Section n={1} title="Questions" right={<span style={MICRO}>ANSWERED FROM THE RECORD, OR PASSED TO YOU</span>}>
                  {(care?.questions ?? biz.aftercare.questions).length === 0 ? (
                    <Nothing
                      title="Nobody has asked anything."
                      why="Buyers and their agents can call ask_support on this store's MCP endpoint. PDR answers from the order record and your published policy — where is it, can I cancel, what is the return window. Anything it cannot answer from real data lands here for you instead of being guessed at."
                    />
                  ) : (care?.questions ?? biz.aftercare.questions).map((q) => (
                    <div key={q.id} className="py-3" style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: q.escalated ? `2px solid ${FAULTB}` : "2px solid transparent", paddingLeft: 10 }}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Stamp text={q.id} color={q.escalated ? FAULTB : DIMB} filled={q.escalated} />
                        {q.orderId && <Num color={FAINTB}>{q.orderId}</Num>}
                        <Num color={FAINTB}>{q.ts.slice(5, 16).replace("T", " ")}</Num>
                        {q.escalated && <Stamp text="nobody answered this" color={FAULTB} />}
                      </div>
                      <div className="mt-1.5 text-pretty text-[13.5px] font-semibold">“{q.question}”</div>
                      {q.answer && <div className="mt-1.5 text-pretty text-[13px]" style={{ color: DIMB }}>→ {q.answer}</div>}
                      {q.escalated && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input value={answerDraft[q.id] ?? ""} onChange={(e) => setAnswerDraft((d) => ({ ...d, [q.id]: e.target.value }))}
                            placeholder="Answer it — this goes on the record against the order"
                            className="h-8 min-w-[280px] flex-1 px-2.5 text-[12.5px]"
                            style={{ fontFamily: SANS, border: `1px solid ${HAIRB}`, backgroundColor: "transparent", color: INKB, outline: "none" }} />
                          <Action onClick={() => answerAsk(q.id)} disabled={!!busy || !(answerDraft[q.id] ?? "").trim()}>
                            {busy === `ask-${q.id}` ? "…" : "ANSWER"}
                          </Action>
                        </div>
                      )}
                    </div>
                  ))}
                </Section>

                <Section n={2} title="Returns" right={<span style={MICRO}>JUDGED AGAINST YOUR PUBLISHED POLICY</span>}>
                  {(care?.returns ?? biz.aftercare.returns).length === 0 ? (
                    <Nothing
                      title="No returns requested."
                      why={`A buyer's agent can call request_return and PDR judges it against what you actually published — "${biz.business.manifest.returns ?? "30 days, unopened"}". Inside the window it lands here for you to approve and refund; outside it, or on a digital item your policy does not cover, it is declined with the reason.`}
                    />
                  ) : (care?.returns ?? biz.aftercare.returns).map((r) => (
                    <div key={r.id} className="py-3" style={{ borderBottom: `1px solid ${HAIRB}`, borderLeft: r.status === "requested" ? `2px solid ${WARNB}` : "2px solid transparent", paddingLeft: 10 }}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Stamp text={r.id} color={DIMB} />
                        <Num color={FAINTB}>{r.orderId}</Num>
                        <Stamp
                          text={r.status}
                          color={r.status === "refunded" ? OKB : r.status === "approved" ? LIVE : r.status === "declined" ? FAINTB : WARNB}
                          filled={r.status === "requested"}
                        />
                        <Num color={FAINTB}>{r.ts.slice(5, 16).replace("T", " ")}</Num>
                        {r.status === "requested" && (
                          <span className="ml-auto flex flex-wrap gap-1.5">
                            <Pick onClick={() => decideReturn(r.id, "approved")} disabled={!!busy} active>Approve</Pick>
                            <Pick onClick={() => decideReturn(r.id, "refunded")} disabled={!!busy}>Refunded</Pick>
                            <Pick onClick={() => decideReturn(r.id, "declined")} disabled={!!busy} danger>Decline</Pick>
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-pretty text-[13px]">“{r.reason}”</div>
                      <div className="mt-1 text-pretty text-[12.5px]" style={{ color: DIMB }}>{r.verdict}</div>
                    </div>
                  ))}
                </Section>

                <Section n={3} title="Deliveries" right={<span style={MICRO}>ISSUED · COLLECTED · WHAT WAS IN IT</span>}>
                  {biz.deliveries.recent.length === 0 ? (
                    <Nothing
                      title="Nothing delivered yet."
                      why="Anything that does not need packing — a file, a licence, a booking, or a document PDR writes itself — is issued the moment the order lands, on a private link. This list shows what went out and whether the buyer actually opened it."
                    />
                  ) : (
                    <>
                      <Heads cols="minmax(0,1fr) 104px 96px 116px 92px" labels={["WHAT WENT OUT", "ORDER", "KIND", "ISSUED", "COLLECTED"]} />
                      {biz.deliveries.recent.map((d) => (
                        <Row key={d.token} cols="minmax(0,1fr) 104px 96px 116px 92px" warn={d.kind === "pending"}>
                          <a href={`/store/${biz.business.slug}/d/${d.token}`} target="_blank" rel="noreferrer"
                            className="truncate text-[13.5px] font-semibold no-underline" style={{ color: INKB }}>
                            {d.productName} <span style={{ color: LIVE }}>↗</span>
                          </a>
                          <Num color={FAINTB}>{d.orderId}</Num>
                          <Stamp text={d.kind} color={d.kind === "pending" ? FAULTB : d.kind === "document" ? LIVE : DIMB} filled={d.kind === "pending"} />
                          <Num color={FAINTB}>{d.issuedAt.slice(5, 16).replace("T", " ")}</Num>
                          {d.claimedAt
                            ? <Stamp text={d.claims > 1 ? `${d.claims} opens` : "opened"} color={OKB} />
                            : <Stamp text="not opened" color={WARNB} />}
                        </Row>
                      ))}
                    </>
                  )}
                </Section>

                <AuditLine
                  measured="deliveries issued and opened · returns judged against the published policy · every question and whether it could be answered"
                  awaiting="refunds executed through a payment rail"
                />
              </>
            )}

            {/* ══════════ 13 SETTINGS ══════════ */}
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
