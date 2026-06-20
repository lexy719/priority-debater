import type { Metadata, Viewport } from "next";
import { Inter, Anton, JetBrains_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/v2/smooth-scroll";
import { Cursor } from "@/components/v2/cursor";
import { CreditsProvider } from "@/components/credits/CreditsProvider";
import { NewsletterModal } from "@/components/NewsletterModal";
import { RouteProgress } from "@/components/RouteProgress";
import "./globals.css";

const sans = Inter({
  variable: "--app-font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const mono = JetBrains_Mono({
  variable: "--app-font-mono",
  subsets: ["latin"],
  display: "swap",
});

const display = Anton({
  variable: "--app-font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://priority-debater.vercel.app"),
  title: {
    default: "Priority Debater - A verdict on your idea before you commit.",
    template: "%s | Priority Debater",
  },
  description:
    "Two paths: stress-test a startup idea with a ruthless five-persona AI panel, or audit how AI agents see your live store and ship the fixes that win the recommendation layer.",
  keywords: [
    "startup validation",
    "idea validator",
    "AI verdict",
    "startup tribunal",
    "founder tool",
    "investor panel simulation",
    "lean canvas",
  ],
  openGraph: {
    title: "Priority Debater - A verdict on your idea.",
    description: "Five expert personas. One verdict. Before you commit.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Priority Debater - A verdict on your idea.",
    description: "Five expert personas. One verdict. Before you commit.",
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Priority Debater",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} ${display.variable} antialiased`}>
        <CreditsProvider>
          <RouteProgress />
          <SmoothScroll>
            <Cursor />
            {children}
          </SmoothScroll>
          <NewsletterModal />
        </CreditsProvider>
      </body>
    </html>
  );
}
