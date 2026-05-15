import type { Metadata, Viewport } from "next";
import { Inter, Anton, JetBrains_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/v2/smooth-scroll";
import { Cursor } from "@/components/v2/cursor";
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
    "Five expert personas debate your startup idea and return a scored verdict, objections, evidence gaps, a risk register, and a full strategic dossier.",
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
        <SmoothScroll>
          <Cursor />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
