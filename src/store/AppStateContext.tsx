import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from 'react';

import { createBotRegistry } from '../bots/botRegistry';
import { createTranslator, resolveLocale } from '../i18n';
import { mockHistorySnapshots } from '../mock/mock.js';
import type { AppState, Locale, ViewState } from '../types/app';
import { createSnapshotFromSession, hasConversationMessages } from '../features/history/historyService';
import {
  getPreferredLocale,
  loadPersistedPreferences,
  persistPreferences,
} from '../features/locale/localeService';
import {
  createBroadcastDraft,
  createInitialSession,
  resolvePendingBotReply,
} from '../features/session/sessionService';
import { appReducer } from './appReducer';
import { selectCurrentSessionRecord, selectVisibleBotIds } from './selectors';

const registry = createBotRegistry();
const initialLocale = resolveLocale(
  typeof navigator !== 'undefined' ? getPreferredLocale(navigator.language) : 'zh-CN',
);
const initialSessionTimestamp = '2026-03-25T00:00:00.000Z';
const allBotIds = registry.getAllBots().map((bot) => bot.definition.id);

function collectBotStates() {
  return Object.fromEntries(
    registry
      .getAllBots()
      .map((bot) => [bot.definition.id, bot.getPersistedState()] as const)
      .filter((entry) => entry[1] !== null),
  );
}

const initialState: AppState = {
  locale: initialLocale,
  currentView: {
    mode: 'active',
    sessionId: 'session-active',
  },
  activeSession: createInitialSession(registry, initialLocale, initialSessionTimestamp),
  historySnapshots: mockHistorySnapshots as AppState['historySnapshots'],
  sidebar: {
    isOpen: true,
  },
};

interface AppStateContextValue {
  state: AppState;
  currentSession: ReturnType<typeof selectCurrentSessionRecord>;
  visibleBotIds: string[];
  isReadonly: boolean;
  t: ReturnType<typeof createTranslator>;
  registry: typeof registry;
  selectView: (view: ViewState) => void;
  setLayout: (layout: AppState['activeSession']['layout']) => void;
  toggleSidebar: () => void;
  replaceBot: (index: number, botId: string) => void;
  setModel: (botId: string, modelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  createNewSession: () => void;
  toggleLocale: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadPersistedPreferences().then((persisted) => {
      if (!persisted) {
        return;
      }

      dispatch({
        type: 'hydrate',
        payload: {
          locale: persisted.locale,
          historySnapshots: persisted.historySnapshots,
          layout: persisted.layout,
          selectedModels: persisted.selectedModels,
          currentView: persisted.currentView,
          activeSession: persisted.activeSession,
          sidebar: persisted.sidebar,
          allBotIds,
        },
      });

      Object.entries(persisted.botStates ?? {}).forEach(([botId, botState]) => {
        registry.getBot(botId).restorePersistedState(botState);
      });
    });
  }, []);

  useEffect(() => {
    persistPreferences({
      locale: state.locale,
      historySnapshots: state.historySnapshots,
      layout: state.activeSession.layout,
      selectedModels: state.activeSession.selectedModels,
      currentView: state.currentView,
      activeSession: state.activeSession,
      botStates: collectBotStates(),
      sidebar: state.sidebar,
    }).catch(() => undefined);
  }, [state]);

  const currentSession = selectCurrentSessionRecord(state);
  const visibleBotIds = selectVisibleBotIds(state);
  const t = useMemo(() => createTranslator(state.locale), [state.locale]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      currentSession,
      visibleBotIds,
      isReadonly: state.currentView.mode === 'history',
      t,
      registry,
      selectView(view) {
        dispatch({ type: 'set-view', payload: view });
      },
      setLayout(layout) {
        dispatch({ type: 'set-layout', payload: { layout, allBotIds } });
      },
      toggleSidebar() {
        dispatch({ type: 'toggle-sidebar' });
      },
      replaceBot(index, botId) {
        dispatch({ type: 'replace-active-bot', payload: { index, botId } });
      },
      setModel(botId, modelId) {
        dispatch({ type: 'set-selected-model', payload: { botId, modelId } });
      },
      async sendMessage(content) {
        const draft = createBroadcastDraft({
          session: state.activeSession,
          registry,
          locale: state.locale,
          content,
        });

        if (!draft) {
          return;
        }

        dispatch({
          type: 'append-active-messages',
          payload: {
            messages: draft.messages,
            updatedAt: draft.updatedAt,
          },
        });

        await Promise.all(
          draft.requests.map(async (request) => {
            const message = await resolvePendingBotReply(request);

            dispatch({
              type: 'replace-active-message',
              payload: {
                message,
                updatedAt: new Date().toISOString(),
              },
            });
          }),
        );
      },
      createNewSession() {
        const timestamp = new Date().toISOString();

        if (hasConversationMessages(state.activeSession.messages)) {
          dispatch({
            type: 'push-history-snapshot',
            payload: createSnapshotFromSession(
              state.activeSession,
              `snapshot-${timestamp}`,
              timestamp,
            ),
          });
        }

        registry.getAllBots().forEach((bot) => {
          bot.resetConversation();
        });

        dispatch({
          type: 'replace-active-session',
          payload: createInitialSession(
            registry,
            state.locale,
            timestamp,
            state.activeSession.layout,
            state.activeSession.activeBotIds,
          ),
        });
      },
      toggleLocale() {
        const nextLocale: Locale = state.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
        dispatch({ type: 'set-locale', payload: nextLocale });
      },
    }),
    [currentSession, state, t, visibleBotIds],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}
