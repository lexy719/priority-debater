import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    default: "Priority Debater — Stress-Test Your Startup Idea With 5 AI Personas",
    template: "%s | Priority Debater",
  },
  description:
    "ChatGPT tells you what you want to hear. We tell you what you need to hear. 5 AI personas rip your startup idea apart from every angle — investor, customer, operator, mentor, adversary. Viability scores, lean canvas, financials, and a brutal debate mode. Free, 2 minutes, no signup.",
  keywords: ["startup validation", "idea validator", "AI validation", "business plan", "startup idea", "startup stress test", "idea validation tool", "lean canvas generator"],
  openGraph: {
    title: "Priority Debater — Stress-Test Your Startup Idea",
    description: "5 AI personas rip your idea apart so the market doesn't have to. Free, 2 minutes, no signup.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Priority Debater — Stress-Test Your Startup Idea",
    description: "5 AI personas rip your idea apart so the market doesn't have to. Free, 2 min.",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Priority Debater",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
