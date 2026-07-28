import "server-only";

/**
 * DEPARTMENTS — the org chart of an autonomous business.
 *
 * Authoritative model: docs/pdr-commerce-architecture.md §5, §6, §17.
 *
 * VOCABULARY, and it is binding. The codebase used "agent" for two opposite
 * things and the confusion was real:
 *
 *   Department    an internal function Commerce coordinates. Marketing,
 *                 Sales, Care, Inventory, Finance, Operations.
 *   Worker        one AI instance doing a department's work. Disposable —
 *                 Claude today, something else next year.
 *   AI shopper    ChatGPT, Claude, Gemini, Perplexity, Copilot. They buy FROM
 *                 us. `classifyAgent` and `AGENT_UAS` mean this and are right.
 *   Executive     Commerce itself, coordinating. Never acts on the business
 *                 directly; it assigns, escalates and records.
 *
 * Six departments rather than the four the code grew: Operations was carrying
 * stock, fulfilment AND order-taking, which is three jobs with three different
 * failure modes and three different people who would be blamed. Splitting them
 * is what lets a permission be granted to one without granting it to all.
 */

/** The six, plus the executive office that coordinates them. */
export type Department = "MARKETING" | "SALES" | "CARE" | "INVENTORY" | "FINANCE" | "OPERATIONS";
export type Desk = Department | "EXECUTIVE";

export const DEPARTMENTS: readonly Department[] = ["MARKETING", "SALES", "CARE", "INVENTORY", "FINANCE", "OPERATIONS"] as const;

export const DEPARTMENT_NAME: Record<Desk, string> = {
  MARKETING: "Marketing",
  SALES: "Sales",
  CARE: "Customer Care",
  INVENTORY: "Inventory",
  FINANCE: "Finance",
  OPERATIONS: "Operations",
  EXECUTIVE: "Executive Office",
};

/** What each is responsible for, in the owner's words — architecture §5. */
export const DEPARTMENT_REMIT: Record<Desk, string> = {
  MARKETING: "SEO, content, email, social, AI visibility, product copy, campaigns.",
  SALES: "Conversion, bundles, upsells, pricing suggestions, offers, checkout.",
  CARE: "Tickets, returns, refunds, policies, knowledge base.",
  INVENTORY: "Stock, forecasting, reorders, supplier communication, availability.",
  FINANCE: "Revenue, profit, expenses, taxes, cash flow, margins.",
  OPERATIONS: "Shipping, fulfilment, logistics, delivery problems.",
  EXECUTIVE: "Coordinates every department, escalates what needs you, keeps the record.",
};

/* ── the control layer ─────────────────────────────────────────────────── */

/**
 * A capability a department may hold. Split finely on purpose: "Marketing may
 * publish" and "Marketing may spend" are wholly different grants, and a model
 * that cannot express one without the other forces an owner to choose between
 * useless and reckless.
 */
export type Capability =
  // Marketing
  | "publish_content" | "schedule_email" | "adjust_ad_budget" | "change_branding"
  // Sales
  | "adjust_price" | "create_offer" | "change_checkout"
  // Care
  | "answer_from_record" | "approve_return" | "issue_refund"
  // Inventory
  | "reorder_stock" | "contact_supplier" | "add_supplier" | "set_availability"
  // Finance
  | "categorise_expense" | "produce_report" | "make_payment"
  // Operations
  | "update_fulfilment" | "flag_delivery_problem";

/**
 * Whether a capability can be undone.
 *
 * Architecture §18: reversibility gates autonomy. A published article can be
 * unpublished; money that has left the account cannot be recalled. Nothing
 * irreversible is ever granted by default, at any tier, however capable the
 * model behind it becomes.
 */
export const IRREVERSIBLE: readonly Capability[] = [
  "adjust_ad_budget", "issue_refund", "make_payment", "reorder_stock", "add_supplier",
] as const;

export function isIrreversible(c: Capability): boolean {
  return IRREVERSIBLE.includes(c);
}

export const CAPABILITY_OF: Record<Department, readonly Capability[]> = {
  MARKETING: ["publish_content", "schedule_email", "adjust_ad_budget", "change_branding"],
  SALES: ["adjust_price", "create_offer", "change_checkout"],
  CARE: ["answer_from_record", "approve_return", "issue_refund"],
  INVENTORY: ["reorder_stock", "contact_supplier", "add_supplier", "set_availability"],
  FINANCE: ["categorise_expense", "produce_report", "make_payment"],
  OPERATIONS: ["update_fulfilment", "flag_delivery_problem"],
};

export const CAPABILITY_LABEL: Record<Capability, string> = {
  publish_content: "Publish articles and product copy",
  schedule_email: "Schedule email to the list",
  adjust_ad_budget: "Change ad spend",
  change_branding: "Change the brand itself",
  adjust_price: "Change a product's price",
  create_offer: "Create bundles and offers",
  change_checkout: "Change the checkout",
  answer_from_record: "Answer questions from the order record",
  approve_return: "Approve a return against your published policy",
  issue_refund: "Send money back to a buyer",
  reorder_stock: "Reorder stock",
  contact_supplier: "Contact an existing supplier",
  add_supplier: "Add a new supplier",
  set_availability: "Mark products in or out of stock",
  categorise_expense: "Categorise expenses",
  produce_report: "Produce reports",
  make_payment: "Make a payment",
  update_fulfilment: "Update fulfilment status",
  flag_delivery_problem: "Flag a delivery problem",
};

/**
 * A department's standing authority.
 *
 * `allowed` is what it may do unattended. Everything else stops and asks. Caps
 * are per day and denominated in euros; a capability with a cap may be used
 * unattended up to it and must ask beyond it.
 */
export type Permission = {
  department: Department;
  armed: boolean;
  allowed: Capability[];
  /** Per-day spend ceiling, where the capability moves money. Zero means ask
      every time, which is the default and the only safe starting point. */
  dailySpendCap: number;
  currency: string;
  /** Free-text scope the owner can add; shown to the worker as its brief. */
  note?: string;
};

/**
 * The default a business starts with: everything OFF.
 *
 * This is a deliberate refusal of the usual product instinct to show value by
 * doing things immediately. An owner who discovers what Commerce is by finding
 * out what it already did will never trust it again, and trust is the entire
 * product. Each capability is granted by a human, once, knowingly.
 */
export function defaultPermissions(): Permission[] {
  return DEPARTMENTS.map((department) => ({
    department,
    armed: false,
    allowed: [],
    dailySpendCap: 0,
    currency: "EUR",
  }));
}

/**
 * The suggestion offered when an owner arms a department: the reversible
 * capabilities only. Presented as a starting point, never applied silently.
 */
export function suggestedGrant(d: Department): Capability[] {
  return CAPABILITY_OF[d].filter((c) => !isIrreversible(c));
}

/** May this department do this, unattended, right now? */
export function may(perms: Permission[], d: Department, c: Capability, amount = 0): {
  allowed: boolean; reason: string;
} {
  const p = perms.find((x) => x.department === d);
  if (!p) return { allowed: false, reason: `${DEPARTMENT_NAME[d]} has no permission record.` };
  if (!p.armed) return { allowed: false, reason: `${DEPARTMENT_NAME[d]} is not armed — it observes and reports, and acts on nothing.` };
  if (!CAPABILITY_OF[d].includes(c)) {
    return { allowed: false, reason: `${CAPABILITY_LABEL[c]} is not ${DEPARTMENT_NAME[d]}'s job.` };
  }
  if (!p.allowed.includes(c)) {
    return { allowed: false, reason: `${DEPARTMENT_NAME[d]} may not ${CAPABILITY_LABEL[c].toLowerCase()} without you.` };
  }
  if (amount > 0 && amount > p.dailySpendCap) {
    return {
      allowed: false,
      reason: p.dailySpendCap === 0
        ? `${DEPARTMENT_NAME[d]} has no spending authority — every euro needs you.`
        : `€${amount.toFixed(2)} is over ${DEPARTMENT_NAME[d]}'s €${p.dailySpendCap} daily limit.`,
    };
  }
  return { allowed: true, reason: `Within ${DEPARTMENT_NAME[d]}'s standing authority.` };
}

/** One sentence describing what a department may do unattended. */
export function describeAuthority(p: Permission): string {
  if (!p.armed) return "Observes and reports. Acts on nothing.";
  if (p.allowed.length === 0) return "Armed, but granted nothing yet — it will ask before every action.";
  const verbs = p.allowed.map((c) => CAPABILITY_LABEL[c].toLowerCase());
  const spend = p.dailySpendCap > 0
    ? ` Up to €${p.dailySpendCap} a day.`
    : " It cannot spend anything.";
  const list = verbs.length === 1 ? verbs[0]
    : `${verbs.slice(0, -1).join(", ")} and ${verbs[verbs.length - 1]}`;
  return `May ${list} without asking.${spend}`;
}

/**
 * Legacy departments map forward. Activity written before the split used four
 * names; OPERATIONS covered stock as well as fulfilment, so historic lines stay
 * under OPERATIONS rather than being retroactively reassigned to INVENTORY —
 * a record that rewrites itself is not a record.
 */
export function fromLegacy(w: string): Desk {
  switch (w.toUpperCase()) {
    case "MARKETING": return "MARKETING";
    case "FINANCE": return "FINANCE";
    case "OPERATIONS": return "OPERATIONS";
    case "SYSTEM": return "EXECUTIVE";
    default: return "EXECUTIVE";
  }
}
