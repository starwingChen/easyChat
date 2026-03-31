import type { HistoryViewPreference, Locale, ViewState } from "../types/app";
import type {
  ChatSession,
  LayoutType,
  SessionSnapshot,
} from "../types/session";

export type AppAction =
  | {
      type: "hydrate";
      payload: Partial<{
        locale: Locale;
        historySnapshots: SessionSnapshot[];
        layout: LayoutType;
        selectedModels: Record<string, string>;
        currentView: ViewState;
        activeSession: ChatSession;
        historyViewPreferences: Record<string, HistoryViewPreference>;
        sidebar: {
          isOpen: boolean;
        };
        allBotIds: string[];
      }>;
    }
  | {
      type: "set-view";
      payload: ViewState;
    }
  | {
      type: "set-locale";
      payload: Locale;
    }
  | {
      type: "set-layout";
      payload: {
        layout: LayoutType;
        allBotIds: string[];
      };
    }
  | {
      type: "toggle-sidebar";
    }
  | {
      type: "replace-active-session";
      payload: ChatSession;
    }
  | {
      type: "append-active-messages";
      payload: {
        messages: ChatSession["messages"];
        updatedAt: string;
      };
    }
  | {
      type: "replace-active-message";
      payload: {
        message: ChatSession["messages"][number];
        updatedAt: string;
      };
    }
  | {
      type: "replace-bot";
      payload: {
        index: number;
        botId: string;
      };
    }
  | {
      type: "set-selected-model";
      payload: {
        botId: string;
        modelId: string;
      };
    }
  | {
      type: "touch-active-session";
      payload: {
        updatedAt: string;
      };
    }
  | {
      type: "push-history-snapshot";
      payload: SessionSnapshot;
    }
  | {
      type: "delete-history-snapshot";
      payload: {
        snapshotId: string;
      };
    };
