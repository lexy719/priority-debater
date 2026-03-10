import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://priority-debater.vercel.app"),
  title: {
    default: "Priority Debater | AI Startup Idea Validator in 2 Minutes",
    template: "%s | Priority Debater",
  },
  description:
    "Validate your startup idea in 2 minutes. Get a viability score, TAM/SAM/SOM, competitor analysis, risk flags, and business plan. Then debate to refine. Free, private, no signup.",
  keywords: ["startup validation", "idea validator", "AI validation", "business plan", "startup idea"],
  openGraph: {
    title: "Priority Debater | AI Startup Idea Validator",
    description: "Validate your startup idea in 2 minutes. Get a viability score, debate to refine. Free, private.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Priority Debater | AI Startup Idea Validator",
    description: "Validate your startup idea in 2 minutes. Free, private.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
