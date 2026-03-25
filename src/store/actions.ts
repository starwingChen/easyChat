import type { Locale, ViewState } from '../types/app';
import type { ChatSession, LayoutType, SessionSnapshot } from '../types/session';

export type AppAction =
  | {
      type: 'hydrate';
      payload: Partial<{
        locale: Locale;
        historySnapshots: SessionSnapshot[];
        layout: LayoutType;
        selectedModels: Record<string, string>;
      }>;
    }
  | {
      type: 'set-view';
      payload: ViewState;
    }
  | {
      type: 'set-locale';
      payload: Locale;
    }
  | {
      type: 'set-layout';
      payload: LayoutType;
    }
  | {
      type: 'replace-active-session';
      payload: ChatSession;
    }
  | {
      type: 'replace-active-bot';
      payload: {
        index: number;
        botId: string;
      };
    }
  | {
      type: 'set-selected-model';
      payload: {
        botId: string;
        modelId: string;
      };
    }
  | {
      type: 'push-history-snapshot';
      payload: SessionSnapshot;
    };
