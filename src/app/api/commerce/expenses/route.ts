import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/studio/activityRepo";
import { addExpense, listExpenses, removeExpense, summarizeExpenses } from "@/lib/studio/expenseRepo";

/**
 * The Finance worker's expense ledger.
 * GET    ?slug=                                  → entries + summary
 * POST   {slug, label, amount, category, date?, recurring?} → add
 * DELETE {slug, id}                              → remove
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const expenses = await listExpenses(slug);
  return NextResponse.json({ ok: true, expenses, summary: summarizeExpenses(expenses) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: { slug?: string; label?: string; amount?: number; category?: string; date?: string; recurring?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const e = await addExpense(slug, {
    label: String(body.label ?? ""), amount: Number(body.amount), category: String(body.category ?? "other"),
    date: body.date, recurring: body.recurring,
  });
  if (!e) return NextResponse.json({ ok: false, error: "label and a positive amount are required" }, { status: 400 });
  await recordActivity(slug, "FINANCE", `Expense ${e.id} recorded — ${e.label} €${e.amount} (${e.category}${e.recurring ? ", monthly" : ""})`);
  const expenses = await listExpenses(slug);
  return NextResponse.json({ ok: true, expense: e, expenses, summary: summarizeExpenses(expenses) });
}

export async function DELETE(req: Request) {
  let body: { slug?: string; id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 }); }
  const slug = String(body.slug ?? "");
  const expenses = await removeExpense(slug, String(body.id ?? ""));
  return NextResponse.json({ ok: true, expenses, summary: summarizeExpenses(expenses) });
}
