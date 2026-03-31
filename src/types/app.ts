import type { ChatSession, LayoutType, SessionSnapshot } from "./session";

export type Locale = "zh-CN" | "en-US";
export type SessionViewMode = "active" | "history";
export interface HistoryViewPreference {
  layout: LayoutType;
  activeBotIds: string[];
}

export interface ViewState {
  mode: SessionViewMode;
  sessionId: string;
}

export interface AppState {
  locale: Locale;
  currentView: ViewState;
  activeSession: ChatSession;
  historySnapshots: SessionSnapshot[];
  historyViewPreferences: Record<string, HistoryViewPreference>;
  sidebar: {
    isOpen: boolean;
  };
}

export interface PersistedPreferences {
  locale: Locale;
  historySnapshots: SessionSnapshot[];
  layout: LayoutType;
  selectedModels: Record<string, string>;
  currentView: ViewState;
  activeSession: ChatSession;
  historyViewPreferences: Record<string, HistoryViewPreference>;
  botStates: Record<string, unknown>;
  sidebar: {
    isOpen: boolean;
  };
}
