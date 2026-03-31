import type { ChatMessage } from "./message";

export type LayoutType = "1" | "2v" | "2h" | "3" | "4";

export interface ChatSession {
  id: string;
  title: string;
  layout: LayoutType;
  activeBotIds: string[];
  selectedModels: Record<string, string>;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionSnapshot {
  id: string;
  sourceSessionId: string;
  title: string;
  layout: LayoutType;
  activeBotIds: string[];
  selectedModels: Record<string, string>;
  messages: ChatMessage[];
  createdAt: string;
}
