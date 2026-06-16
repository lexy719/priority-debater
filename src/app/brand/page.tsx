import { redirect } from "next/navigation";

// The Brand stage now lives at /brand-kit (the new flow design, wired to the
// extended /api/brand-kit). Keep /brand working by redirecting.
export default function BrandPage() {
  redirect("/brand-kit");
}
