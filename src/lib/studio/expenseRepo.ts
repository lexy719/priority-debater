/**
 * Expense repository — the other half of financial truth.
 *
 * Revenue and COGS Commerce can derive; operating expenses are knowledge only
 * the owner has. Recorded as dated entries with a category and an optional
 * monthly-recurring flag, they unlock net profit, burn and a real cash-flow
 * series. Nothing is estimated: a month with no entries reports no expenses
 * rather than a modelled figure.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { blobConfigured, getJson, putJson } from "./blobStore";

export const EXPENSE_CATEGORIES = [
  "materials", "advertising", "software", "shipping", "fees", "rent", "salary", "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  /** ISO date (YYYY-MM-DD) the money left the business. */
  date: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  /** True = a standing monthly cost, counted in every month from `date`. */
  recurring: boolean;
  createdAt: string;
};

const DIR = path.join(process.cwd(), ".data", "expenses");
const SLUG_RE = /^[a-z0-9-]{3,64}$/;

async function readAll(slug: string): Promise<Expense[]> {
  if (blobConfigured()) {
    const blob = await getJson<Expense[]>(`expenses/${slug}.json`);
    if (blob) return blob;
  }
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${slug}.json`), "utf8")) as Expense[]; } catch { return []; }
}

async function writeAll(slug: string, rows: Expense[]): Promise<void> {
  if (blobConfigured()) { await putJson(`expenses/${slug}.json`, rows); return; }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.json`), JSON.stringify(rows, null, 2), "utf8");
}

export async function listExpenses(slug: string): Promise<Expense[]> {
  if (!SLUG_RE.test(slug)) return [];
  return (await readAll(slug)).sort((a, b) => b.date.localeCompare(a.date));
}

export async function addExpense(
  slug: string,
  input: { date?: string; label: string; amount: number; category: string; recurring?: boolean },
): Promise<Expense | null> {
  if (!SLUG_RE.test(slug)) return null;
  const label = input.label.trim().slice(0, 90);
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!label || !Number.isFinite(amount) || amount <= 0) return null;
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(input.category)
    ? (input.category as ExpenseCategory) : "other";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date ?? "") ? input.date! : new Date().toISOString().slice(0, 10);

  const rows = await readAll(slug);
  const e: Expense = {
    id: `EXP-${(rows.length + 1).toString().padStart(3, "0")}`,
    date, label, amount, category, recurring: input.recurring === true,
    createdAt: new Date().toISOString(),
  };
  rows.push(e);
  await writeAll(slug, rows);
  return e;
}

export async function removeExpense(slug: string, id: string): Promise<Expense[]> {
  const rows = (await readAll(slug)).filter((e) => e.id !== id);
  await writeAll(slug, rows);
  return rows;
}

export type ExpenseSummary = {
  total: number;
  monthlyRecurring: number;
  byCategory: Record<string, number>;
  /** Expense total per ISO month, e.g. "2026-07". Recurring costs are counted
      in every month from their start date to now. */
  byMonth: Record<string, number>;
  count: number;
};

export function summarizeExpenses(rows: Expense[]): ExpenseSummary {
  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  let total = 0;
  let monthlyRecurring = 0;
  const nowMonth = new Date().toISOString().slice(0, 7);

  for (const e of rows) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    if (e.recurring) {
      monthlyRecurring += e.amount;
      // Charge a standing cost to every month from its start through now.
      let m = e.date.slice(0, 7);
      let guard = 0;
      while (m <= nowMonth && guard++ < 60) {
        byMonth[m] = (byMonth[m] ?? 0) + e.amount;
        total += e.amount;
        const [y, mo] = m.split("-").map(Number);
        m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
      }
    } else {
      const m = e.date.slice(0, 7);
      byMonth[m] = (byMonth[m] ?? 0) + e.amount;
      total += e.amount;
    }
  }
  return {
    total: Math.round(total), monthlyRecurring: Math.round(monthlyRecurring),
    byCategory, byMonth, count: rows.length,
  };
}
