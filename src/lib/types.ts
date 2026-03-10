export interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
  isQuickAction?: boolean;
}

export interface DebateSetup {
  template: string;
  topic: string;
  position: string;
  context: string;
  lens: "investor" | "customer" | "competitor" | "postmortem" | "market" | "future";
}

export interface ValidationSession {
  setup: DebateSetup;
  validationContent: string;
  messages: Message[];
  createdAt: number;
}

export const SESSION_KEY = "priority-debater-session";
