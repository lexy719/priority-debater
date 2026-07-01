import { guardAndSpend, guardFailResponse, refund } from "@/lib/credits/server";
import { costOf } from "@/lib/credits/costs";
import { getReportByShareId } from "@/lib/commerce/report-store";
import { route as routeAgent } from "@/lib/commerce/agent/agent";
import { runSkill, skillForFixType, SKILLS } from "@/lib/commerce/agent/skills";
import { appendMessages, createThread, getThread, newMessage } from "@/lib/commerce/agent/thread-store";
import type { CommerceReport } from "@/lib/commerce/types";

/** Trust a client-supplied report only when it's well-formed and matches the id. */
function validReport(r: unknown, reportId: string): r is CommerceReport {
  const x = r as CommerceReport | undefined;
  return !!x && x.shareId === reportId && typeof x.storeName === "string" && Array.isArray(x.fixes) && Array.isArray(x.buyerQueries);
}

// Skill generation is an OpenAI round-trip (sometimes two) — give it head-room.
export const maxDuration = 60;

/**
 * POST /api/commerce/agent/message — the PD Agent chat endpoint.
 *
 * Billing:
 *   - a free-form message charges `commerce_agent_chat` (1 cr). If the agent
 *     decides to GENERATE something, it charges `commerce_agent_action` (10 cr)
 *     on top — and refunds it if generation fails.
 *   - a direct fix execution (`fixId`, from the report's "Execute with agent"
 *     button) charges `commerce_agent_action` (10 cr) only.
 */
export async function POST(request: Request) {
  let body: { threadId?: string; reportId?: string; message?: string; fixId?: string; report?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const reportId = String(body.reportId ?? "").trim();
  const message = String(body.message ?? "").trim();
  const fixId = body.fixId ? String(body.fixId).trim() : undefined;
  if (!reportId) return Response.json({ error: "Missing report id." }, { status: 400 });
  if (!fixId && !message) return Response.json({ error: "Empty message." }, { status: 400 });

  const isDirectFix = !!fixId;
  const primary = isDirectFix ? "commerce_agent_action" : "commerce_agent_chat";

  const guard = await guardAndSpend(primary);
  if (!guard.ok) return guardFailResponse(guard);

  // Prefer the client's own report (localStorage) so the agent never depends on
  // the ephemeral server store; fall back to it only when the body lacks one.
  const report = validReport(body.report, reportId) ? body.report : await getReportByShareId(reportId);
  if (!report) {
    await refund(primary);
    return Response.json({ error: "Report not found — run a scan first." }, { status: 404 });
  }

  let thread = body.threadId ? getThread(body.threadId) : null;
  if (!thread || thread.reportId !== reportId) {
    thread = createThread(guard.userId, reportId, isDirectFix ? `Fix · ${report.storeName}` : message);
  }

  try {
    // ── direct fix execution ──────────────────────────────────────────────
    if (isDirectFix) {
      const fix = report.fixes.find((f) => f.id === fixId);
      const skill = fix ? skillForFixType(fix.type) : "buying_guide";
      let artifact;
      try {
        artifact = await runSkill(skill, report);
      } catch {
        await refund("commerce_agent_action");
        return Response.json({ error: "Generation failed — no credits charged. Try again." }, { status: 502 });
      }
      const narration = `Done. I built your ${SKILLS[skill].label.toLowerCase()} for ${report.storeName} from your report — preview below. Copy it, or approve to publish (Shopify connect is coming soon).`;
      appendMessages(thread, [
        newMessage("user", `Execute: ${fix?.outcome ?? "my top blocker"}`),
        newMessage("assistant", narration, artifact),
      ]);
      return Response.json({ thread, balance: guard.balance });
    }

    // ── free-form chat ────────────────────────────────────────────────────
    const decision = await routeAgent(report, thread.messages, message);

    if (decision.kind === "answer") {
      appendMessages(thread, [newMessage("user", message), newMessage("assistant", decision.text)]);
      return Response.json({ thread, balance: guard.balance });
    }

    // the agent wants to generate → charge the action on top of the chat
    const actionGuard = await guardAndSpend("commerce_agent_action");
    if (!actionGuard.ok) {
      const txt =
        actionGuard.status === 402
          ? `That fix costs ${costOf("commerce_agent_action")} credits to generate and you're short right now. Top up and ask again — I'll build it instantly.`
          : "I couldn't start that fix just now.";
      appendMessages(thread, [newMessage("user", message), newMessage("assistant", txt)]);
      return Response.json({ thread, balance: guard.balance, needCredits: actionGuard.status === 402 });
    }

    let artifact;
    try {
      artifact = await runSkill(decision.skill, report);
    } catch {
      await refund("commerce_agent_action");
      appendMessages(thread, [
        newMessage("user", message),
        newMessage("assistant", `That generation failed, so I refunded the ${costOf("commerce_agent_action")} credits. Try again in a moment.`),
      ]);
      return Response.json({ thread, balance: guard.balance });
    }

    appendMessages(thread, [newMessage("user", message), newMessage("assistant", decision.narration, artifact)]);
    return Response.json({ thread, balance: actionGuard.balance });
  } catch {
    await refund(primary);
    return Response.json({ error: "The agent hit an error — no credits charged." }, { status: 500 });
  }
}
