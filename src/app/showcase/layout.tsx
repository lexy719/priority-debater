"use client";

import TickerTape from "@/components/dashboard/TickerTape";
import Footer from "@/components/dashboard/Footer";
import ShowcaseNavbar from "@/components/showcase/ShowcaseNavbar";

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--paper)] text-black">
            <ShowcaseNavbar />
            <TickerTape />
            {children}
            <TickerTape />
            <Footer />
        </div>
    );
}
