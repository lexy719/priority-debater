import { redirect } from "next/navigation";

// The canonical Chamber is /debate (DebateChamber). Keep the old
// /results/debate path working by redirecting to it.
export default function ResultsDebateRedirect() {
  redirect("/debate");
}
