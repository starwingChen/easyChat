import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type PropsWithChildren,
} from 'react';

import { createBotRegistry } from '../bots/botRegistry';
import { resolveLocale } from '../i18n';
import type { AppState, Locale, ViewState } from '../types/app';
import type { ApiBotConfigValue } from '../types/bot';
import {
  createSnapshotFromSession,
  hasCompletedAssistantReplies,
} from '../features/history/historyService';
import {
  getPreferredLocale,
  loadPersistedPreferences,
  persistPreferences,
} from '../features/locale/localeService';
import {
  BOT_REPLY_RETRY_LIMIT,
  createCancelledAssistantMessage,
  createBroadcastDraft,
  createInitialSession,
  createRetryReplyRequest,
  normalizeInterruptedSession,
  resolvePendingBotReply,
} from '../features/session/sessionService';
import { appReducer } from './appReducer';
import {
  selectCurrentSessionRecord,
  selectCurrentViewBotOptions,
  selectHasVisibleLoadingMessages,
  selectVisibleBotIds,
} from './selectors';

const registry = createBotRegistry();
const initialLocale = resolveLocale(
  typeof navigator !== 'undefined'
    ? getPreferredLocale(navigator.language)
    : 'zh-CN'
);
const initialSessionTimestamp = '2026-03-25T00:00:00.000Z';
const allBotIds = registry.getAllBots().map((bot) => bot.definition.id);
const STREAM_MESSAGE_FLUSH_MS = 50;
const PERSIST_PREFERENCES_DEBOUNCE_MS = 150;

function collectBotStates() {
  return Object.fromEntries(
    registry
      .getAllBots()
      .map((bot) => [bot.definition.id, bot.getPersistedState()] as const)
      .filter((entry) => entry[1] !== null)
  );
}

const initialState: AppState = {
  locale: initialLocale,
  currentView: {
    mode: 'active',
    sessionId: 'session-active',
  },
  activeSession: createInitialSession(
    registry,
    initialLocale,
    initialSessionTimestamp
  ),
  historySnapshots: [],
  historyViewPreferences: {},
  sidebar: {
    isOpen: false,
  },
};

interface AppStateContextValue {
  state: AppState;
  currentSession: ReturnType<typeof selectCurrentSessionRecord>;
  cancelReply: (messageId: string) => void;
  retryReply: (messageId: string) => void;
  isComposerDisabled: boolean;
  visibleBotIds: string[];
  isReadonly: boolean;
  registry: typeof registry;
  selectView: (view: ViewState) => void;
  setLayout: (layout: AppState['activeSession']['layout']) => void;
  toggleSidebar: () => void;
  replaceBot: (index: number, botId: string) => void;
  focusBotInSingleLayout: (botId: string) => void;
  setModel: (botId: string, modelId: string) => void;
  addSavedApiModel: (botId: string, modelName: string) => Promise<void>;
  removeSavedApiModel: (botId: string, modelName: string) => Promise<void>;
  saveApiConfig: (botId: string, config: ApiBotConfigValue) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createNewSession: () => void;
  deleteHistorySnapshot: (snapshotId: string) => void;
  toggleLocale: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const stateRef = useRef(state);
  const pendingReplyControllers = useRef(
    new Map<string, AbortController>()
  ).current;
  const pendingStreamMessages = useRef(
    new Map<
      string,
      {
        message: AppState['activeSession']['messages'][number];
        timeoutId: ReturnType<typeof setTimeout> | null;
      }
    >()
  ).current;
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  stateRef.current = state;

  function applyPendingStreamMessages(appState: AppState): AppState {
    if (pendingStreamMessages.size === 0) {
      return appState;
    }

    const pendingById = new Map(
      Array.from(pendingStreamMessages.entries()).map(([messageId, entry]) => [
        messageId,
        entry.message,
      ])
    );

    return {
      ...appState,
      activeSession: {
        ...appState.activeSession,
        messages: appState.activeSession.messages.map(
          (message) => pendingById.get(message.id) ?? message
        ),
      },
    };
  }

  function buildPersistedPayload(appState: AppState) {
    const appStateWithPendingStreams = applyPendingStreamMessages(appState);
    const normalizedActiveSession = normalizeInterruptedSession(
      appStateWithPendingStreams.activeSession,
      appStateWithPendingStreams.locale
    );

    return {
      locale: appStateWithPendingStreams.locale,
      historySnapshots: appStateWithPendingStreams.historySnapshots,
      layout: normalizedActiveSession.layout,
      selectedModels: normalizedActiveSession.selectedModels,
      currentView: appStateWithPendingStreams.currentView,
      activeSession: normalizedActiveSession,
      historyViewPreferences: appStateWithPendingStreams.historyViewPreferences,
      botStates: collectBotStates(),
      sidebar: appStateWithPendingStreams.sidebar,
    };
  }

  function clearPendingStreamMessage(messageId: string) {
    const pending = pendingStreamMessages.get(messageId);

    if (!pending) {
      return;
    }

    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId);
    }

    pendingStreamMessages.delete(messageId);
  }

  function flushPendingStreamMessage(messageId: string) {
    const pending = pendingStreamMessages.get(messageId);

    if (!pending) {
      return;
    }

    if (pending.timeoutId) {
      clearTimeout(pending.timeoutId);
    }

    pendingStreamMessages.delete(messageId);

    dispatch({
      type: 'replace-active-message',
      payload: {
        message: pending.message,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  function queuePendingStreamMessage(
    message: AppState['activeSession']['messages'][number]
  ) {
    const existing = pendingStreamMessages.get(message.id);
    const nextEntry = existing ?? {
      message,
      timeoutId: null,
    };

    nextEntry.message = message;
    pendingStreamMessages.set(message.id, nextEntry);

    if (nextEntry.timeoutId) {
      return;
    }

    nextEntry.timeoutId = setTimeout(() => {
      flushPendingStreamMessage(message.id);
    }, STREAM_MESSAGE_FLUSH_MS);
  }

  useEffect(() => {
    loadPersistedPreferences().then((persisted) => {
      if (!persisted) {
        return;
      }

      const historySnapshots = persisted.historySnapshots?.filter(
        (snapshot) => !snapshot.sourceSessionId.startsWith('session-previous-')
      );
      const currentView: ViewState | undefined =
        persisted.currentView?.mode === 'history' &&
        !historySnapshots?.some(
          (snapshot) => snapshot.id === persisted.currentView?.sessionId
        )
          ? { mode: 'active', sessionId: 'session-active' }
          : persisted.currentView;

      dispatch({
        type: 'hydrate',
        payload: {
          locale: persisted.locale,
          historySnapshots,
          layout: persisted.layout,
          selectedModels: persisted.selectedModels,
          currentView,
          activeSession: persisted.activeSession
            ? normalizeInterruptedSession(
                persisted.activeSession,
                persisted.locale ?? initialLocale
              )
            : undefined,
          historyViewPreferences: persisted.historyViewPreferences,
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
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      persistTimeoutRef.current = null;
      void persistPreferences(buildPersistedPayload(stateRef.current)).catch(
        () => undefined
      );
    }, PERSIST_PREFERENCES_DEBOUNCE_MS);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
  }, [state]);

  useEffect(() => {
    return () => {
      pendingStreamMessages.forEach((entry) => {
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }
      });
      pendingStreamMessages.clear();

      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }

      pendingReplyControllers.forEach((controller) => {
        controller.abort();
      });
      pendingReplyControllers.clear();

      void persistPreferences(buildPersistedPayload(stateRef.current)).catch(
        () => undefined
      );
    };
  }, []);

  const currentSession = selectCurrentSessionRecord(state);
  const currentViewBotOptions = selectCurrentViewBotOptions(state, allBotIds);
  const hasVisibleLoadingMessages = selectHasVisibleLoadingMessages(state);
  const visibleBotIds = selectVisibleBotIds(state);

  const value: AppStateContextValue = {
    state,
    currentSession,
    cancelReply(messageId) {
      pendingReplyControllers.get(messageId)?.abort();
      pendingReplyControllers.delete(messageId);
      clearPendingStreamMessage(messageId);

      const loadingMessage = state.activeSession.messages.find(
        (message) =>
          message.id === messageId &&
          (message.status === 'loading' || message.status === 'streaming')
      );

      if (!loadingMessage) {
        return;
      }

      dispatch({
        type: 'replace-active-message',
        payload: {
          message: createCancelledAssistantMessage(
            loadingMessage,
            state.locale
          ),
          updatedAt: new Date().toISOString(),
        },
      });
    },
    retryReply(messageId) {
      const retryableMessage = state.activeSession.messages.find(
        (message) =>
          message.id === messageId &&
          message.role === 'assistant' &&
          (message.status === 'error' || message.status === 'cancelled')
      );

      if (!retryableMessage) {
        return;
      }

      const request = createRetryReplyRequest({
        locale: state.locale,
        message: retryableMessage,
        registry,
        sessionId: state.activeSession.id,
      });

      if (!request) {
        return;
      }

      dispatch({
        type: 'replace-active-message',
        payload: {
          message: {
            ...retryableMessage,
            content: '',
            status: 'loading',
            retryCount: 0,
            retryLimit: BOT_REPLY_RETRY_LIMIT,
          },
          updatedAt: new Date().toISOString(),
        },
      });

      void (async () => {
        const abortController = new AbortController();
        pendingReplyControllers.set(request.messageId, abortController);

        const message = await resolvePendingBotReply({
          ...request,
          onRetry(retryingMessage) {
            if (
              pendingReplyControllers.get(request.messageId) !== abortController
            ) {
              return;
            }

            dispatch({
              type: 'replace-active-message',
              payload: {
                message: retryingMessage,
                updatedAt: new Date().toISOString(),
              },
            });
          },
          onStreamUpdate(streamingMessage) {
            if (
              pendingReplyControllers.get(request.messageId) !== abortController
            ) {
              return;
            }

            queuePendingStreamMessage(streamingMessage);
          },
          signal: abortController.signal,
        });

        if (
          pendingReplyControllers.get(request.messageId) !== abortController
        ) {
          return;
        }

        pendingReplyControllers.delete(request.messageId);
        clearPendingStreamMessage(request.messageId);

        dispatch({
          type: 'replace-active-message',
          payload: {
            message,
            updatedAt: new Date().toISOString(),
          },
        });
      })();
    },
    isComposerDisabled: hasVisibleLoadingMessages,
    visibleBotIds,
    isReadonly: state.currentView.mode === 'history',
    registry,
    selectView(view) {
      dispatch({ type: 'set-view', payload: view });
    },
    setLayout(layout) {
      dispatch({
        type: 'set-layout',
        payload: {
          layout,
          allBotIds: currentViewBotOptions,
        },
      });
    },
    toggleSidebar() {
      dispatch({ type: 'toggle-sidebar' });
    },
    replaceBot(index, botId) {
      dispatch({ type: 'replace-bot', payload: { index, botId } });
    },
    focusBotInSingleLayout(botId) {
      dispatch({
        type: 'focus-bot-single-layout',
        payload: { botId },
      });
    },
    setModel(botId, modelId) {
      dispatch({ type: 'set-selected-model', payload: { botId, modelId } });
    },
    async addSavedApiModel(botId, modelName) {
      registry.getBot(botId).addSavedModel(modelName);
      const updatedAt = new Date().toISOString();
      const activeSession = {
        ...state.activeSession,
        updatedAt,
      };

      dispatch({
        type: 'touch-active-session',
        payload: { updatedAt },
      });

      await persistPreferences(
        buildPersistedPayload({
          ...state,
          activeSession,
        })
      ).catch(() => undefined);
    },
    async removeSavedApiModel(botId, modelName) {
      registry.getBot(botId).removeSavedModel(modelName);
      const updatedAt = new Date().toISOString();
      const activeSession = {
        ...state.activeSession,
        updatedAt,
      };

      dispatch({
        type: 'touch-active-session',
        payload: { updatedAt },
      });

      await persistPreferences(
        buildPersistedPayload({
          ...state,
          activeSession,
        })
      ).catch(() => undefined);
    },
    async saveApiConfig(botId, config) {
      registry.getBot(botId).setApiConfig(config);
      const updatedAt = new Date().toISOString();
      const activeSession = {
        ...state.activeSession,
        updatedAt,
      };

      dispatch({
        type: 'touch-active-session',
        payload: { updatedAt },
      });

      await persistPreferences(
        buildPersistedPayload({
          ...state,
          activeSession,
        })
      ).catch(() => undefined);
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
          const abortController = new AbortController();
          pendingReplyControllers.set(request.messageId, abortController);

          const message = await resolvePendingBotReply({
            ...request,
            onRetry(retryingMessage) {
              if (
                pendingReplyControllers.get(request.messageId) !==
                abortController
              ) {
                return;
              }

              dispatch({
                type: 'replace-active-message',
                payload: {
                  message: retryingMessage,
                  updatedAt: new Date().toISOString(),
                },
              });
            },
            onStreamUpdate(streamingMessage) {
              if (
                pendingReplyControllers.get(request.messageId) !==
                abortController
              ) {
                return;
              }

              queuePendingStreamMessage(streamingMessage);
            },
            signal: abortController.signal,
          });

          if (
            pendingReplyControllers.get(request.messageId) !== abortController
          ) {
            return;
          }

          pendingReplyControllers.delete(request.messageId);
          clearPendingStreamMessage(request.messageId);

          dispatch({
            type: 'replace-active-message',
            payload: {
              message,
              updatedAt: new Date().toISOString(),
            },
          });
        })
      );
    },
    createNewSession() {
      const timestamp = new Date().toISOString();

      if (hasCompletedAssistantReplies(state.activeSession.messages)) {
        dispatch({
          type: 'push-history-snapshot',
          payload: createSnapshotFromSession(
            state.activeSession,
            `snapshot-${timestamp}`,
            timestamp
          ),
        });
      }

      pendingReplyControllers.forEach((controller) => {
        controller.abort();
      });
      pendingReplyControllers.clear();
      pendingStreamMessages.forEach((entry, messageId) => {
        if (entry.timeoutId) {
          clearTimeout(entry.timeoutId);
        }
        pendingStreamMessages.delete(messageId);
      });

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
          state.activeSession.activeBotIds
        ),
      });
    },
    deleteHistorySnapshot(snapshotId) {
      dispatch({
        type: 'delete-history-snapshot',
        payload: { snapshotId },
      });
    },
    toggleLocale() {
      const nextLocale: Locale = state.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
      dispatch({ type: 'set-locale', payload: nextLocale });
    },
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
}
