import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Create account — Priority Debater",
  description: "Create a free account and get 50 credits to validate and debate your idea.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SiteNav />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1100px] items-center justify-center px-5 py-20">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </main>
    </div>
  );
}
