import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Persona chat",
  description:
    "Five separate chats — Investor, Customer, Operator, adversary-style pressure, Mentor — each in character.",
};

export default function PersonaChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
