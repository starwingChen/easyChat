import { getSnapshotBrowseableBotIds } from "../features/history/historyService";
import type { AppState } from "../types/app";
import {
  ensureBotsForLayout,
  replaceBotAtIndex,
} from "../features/layout/layoutService";
import type { AppAction } from "./actions";

function normalizeHistoryBotIds(
  activeBotIds: string[],
  availableBotIds: string[],
): string[] {
  const availableBotIdSet = new Set(availableBotIds);

  return Array.from(new Set(activeBotIds)).filter((botId) =>
    availableBotIdSet.has(botId),
  );
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate": {
      const allBotIds =
        action.payload.allBotIds ?? state.activeSession.activeBotIds;
      const baseActiveSession = action.payload.activeSession
        ? {
            ...state.activeSession,
            ...action.payload.activeSession,
          }
        : state.activeSession;
      const layout =
        action.payload.activeSession?.layout ??
        action.payload.layout ??
        state.activeSession.layout;
      const selectedModels = {
        ...state.activeSession.selectedModels,
        ...action.payload.selectedModels,
        ...action.payload.activeSession?.selectedModels,
      };

      return {
        ...state,
        locale: action.payload.locale ?? state.locale,
        currentView: action.payload.currentView ?? state.currentView,
        historySnapshots:
          action.payload.historySnapshots ?? state.historySnapshots,
        historyViewPreferences:
          action.payload.historyViewPreferences ?? state.historyViewPreferences,
        sidebar: action.payload.sidebar ?? state.sidebar,
        activeSession: {
          ...baseActiveSession,
          layout,
          selectedModels,
          activeBotIds: ensureBotsForLayout({
            layout,
            activeBotIds:
              action.payload.activeSession?.activeBotIds ??
              state.activeSession.activeBotIds,
            allBotIds,
          }),
        },
      };
    }
    case "set-view":
      return {
        ...state,
        currentView: action.payload,
      };
    case "set-locale":
      return {
        ...state,
        locale: action.payload,
      };
    case "set-layout":
      if (state.currentView.mode === "history") {
        const snapshot = state.historySnapshots.find(
          (item) => item.id === state.currentView.sessionId,
        );

        if (!snapshot) {
          return state;
        }

        const browseableBotIds = getSnapshotBrowseableBotIds(snapshot);
        const currentPreference = state.historyViewPreferences[snapshot.id];

        return {
          ...state,
          historyViewPreferences: {
            ...state.historyViewPreferences,
            [snapshot.id]: {
              layout: action.payload.layout,
              activeBotIds: normalizeHistoryBotIds(
                currentPreference?.activeBotIds ?? snapshot.activeBotIds,
                browseableBotIds,
              ),
            },
          },
        };
      }

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
    case "toggle-sidebar":
      return {
        ...state,
        sidebar: {
          isOpen: !state.sidebar.isOpen,
        },
      };
    case "replace-active-session":
      return {
        ...state,
        activeSession: action.payload,
        currentView: { mode: "active", sessionId: action.payload.id },
      };
    case "append-active-messages":
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          messages: [
            ...state.activeSession.messages,
            ...action.payload.messages,
          ],
          updatedAt: action.payload.updatedAt,
        },
      };
    case "replace-active-message": {
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
            message.id === action.payload.message.id
              ? action.payload.message
              : message,
          ),
          updatedAt: action.payload.updatedAt,
        },
      };
    }
    case "replace-bot":
      if (state.currentView.mode === "history") {
        const snapshot = state.historySnapshots.find(
          (item) => item.id === state.currentView.sessionId,
        );

        if (!snapshot) {
          return state;
        }

        const browseableBotIds = getSnapshotBrowseableBotIds(snapshot);
        const currentPreference = state.historyViewPreferences[snapshot.id];
        const layout = currentPreference?.layout ?? snapshot.layout;
        const nextActiveBotIds = replaceBotAtIndex(
          normalizeHistoryBotIds(
            currentPreference?.activeBotIds ?? snapshot.activeBotIds,
            browseableBotIds,
          ),
          action.payload.index,
          action.payload.botId,
        );

        return {
          ...state,
          historyViewPreferences: {
            ...state.historyViewPreferences,
            [snapshot.id]: {
              layout,
              activeBotIds: normalizeHistoryBotIds(
                nextActiveBotIds,
                browseableBotIds,
              ),
            },
          },
        };
      }

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
    case "set-selected-model":
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
    case "touch-active-session":
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          updatedAt: action.payload.updatedAt,
        },
      };
    case "push-history-snapshot":
      return {
        ...state,
        historySnapshots: [action.payload, ...state.historySnapshots],
      };
    case "delete-history-snapshot": {
      const historySnapshots = state.historySnapshots.filter(
        (snapshot) => snapshot.id !== action.payload.snapshotId,
      );
      const isDeletingCurrentHistory =
        state.currentView.mode === "history" &&
        state.currentView.sessionId === action.payload.snapshotId;

      return {
        ...state,
        currentView: isDeletingCurrentHistory
          ? { mode: "active", sessionId: state.activeSession.id }
          : state.currentView,
        historyViewPreferences: Object.fromEntries(
          Object.entries(state.historyViewPreferences).filter(
            ([snapshotId]) => snapshotId !== action.payload.snapshotId,
          ),
        ),
        historySnapshots,
      };
    }
  }
}
