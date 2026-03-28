import type { AppState } from '../types/app';
import { ensureBotsForLayout, replaceBotAtIndex } from '../features/layout/layoutService';
import type { AppAction } from './actions';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'hydrate': {
      const allBotIds = action.payload.allBotIds ?? state.activeSession.activeBotIds;
      const baseActiveSession = action.payload.activeSession
        ? {
            ...state.activeSession,
            ...action.payload.activeSession,
          }
        : state.activeSession;
      const layout = action.payload.activeSession?.layout ?? action.payload.layout ?? state.activeSession.layout;
      const selectedModels = {
        ...state.activeSession.selectedModels,
        ...action.payload.selectedModels,
        ...action.payload.activeSession?.selectedModels,
      };

      return {
        ...state,
        locale: action.payload.locale ?? state.locale,
        currentView: action.payload.currentView ?? state.currentView,
        historySnapshots: action.payload.historySnapshots ?? state.historySnapshots,
        sidebar: action.payload.sidebar ?? state.sidebar,
        activeSession: {
          ...baseActiveSession,
          layout,
          selectedModels,
          activeBotIds: ensureBotsForLayout({
            layout,
            activeBotIds: action.payload.activeSession?.activeBotIds ?? state.activeSession.activeBotIds,
            allBotIds,
          }),
        },
      };
    }
    case 'set-view':
      return {
        ...state,
        currentView: action.payload,
      };
    case 'set-locale':
      return {
        ...state,
        locale: action.payload,
      };
    case 'set-layout':
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          layout: action.payload.layout,
          activeBotIds: ensureBotsForLayout({
            layout: action.payload.layout,
            activeBotIds: state.activeSession.activeBotIds,
            allBotIds: action.payload.allBotIds,
          }),
        },
      };
    case 'toggle-sidebar':
      return {
        ...state,
        sidebar: {
          isOpen: !state.sidebar.isOpen,
        },
      };
    case 'replace-active-session':
      return {
        ...state,
        activeSession: action.payload,
        currentView: { mode: 'active', sessionId: action.payload.id },
      };
    case 'append-active-messages':
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          messages: [...state.activeSession.messages, ...action.payload.messages],
          updatedAt: action.payload.updatedAt,
        },
      };
    case 'replace-active-message': {
      const hasTargetMessage = state.activeSession.messages.some(
        (message) => message.id === action.payload.message.id,
      );

      if (!hasTargetMessage) {
        return state;
      }

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          messages: state.activeSession.messages.map((message) =>
            message.id === action.payload.message.id ? action.payload.message : message,
          ),
          updatedAt: action.payload.updatedAt,
        },
      };
    }
    case 'replace-active-bot':
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          activeBotIds: replaceBotAtIndex(
            state.activeSession.activeBotIds,
            action.payload.index,
            action.payload.botId,
          ),
        },
      };
    case 'set-selected-model':
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          selectedModels: {
            ...state.activeSession.selectedModels,
            [action.payload.botId]: action.payload.modelId,
          },
        },
      };
    case 'touch-active-session':
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          updatedAt: action.payload.updatedAt,
        },
      };
    case 'push-history-snapshot':
      return {
        ...state,
        historySnapshots: [action.payload, ...state.historySnapshots],
      };
    case 'delete-history-snapshot': {
      const historySnapshots = state.historySnapshots.filter(
        (snapshot) => snapshot.id !== action.payload.snapshotId,
      );
      const isDeletingCurrentHistory =
        state.currentView.mode === 'history' &&
        state.currentView.sessionId === action.payload.snapshotId;

      return {
        ...state,
        currentView: isDeletingCurrentHistory
          ? { mode: 'active', sessionId: state.activeSession.id }
          : state.currentView,
        historySnapshots,
      };
    }
  }
}
