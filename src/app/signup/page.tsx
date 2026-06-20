import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Create account — Priority Debater",
  description: "Create a free account and get 50 credits to validate and debate your idea.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <AuthShell mode="signup">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </AuthShell>
    </div>
  );
}
