import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Sign in — Priority Debater",
  description: "Sign in to your Priority Debater account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <AuthShell mode="login">
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </AuthShell>
    </div>
  );
}
