import { mockBotDefinitions } from '../mock/mock.js';
import type { AppState } from '../types/app';
import { ensureBotsForLayout, replaceBotAtIndex } from '../features/layout/layoutService';
import type { AppAction } from './actions';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'hydrate': {
      const layout = action.payload.layout ?? state.activeSession.layout;
      const selectedModels = {
        ...state.activeSession.selectedModels,
        ...action.payload.selectedModels,
      };

      return {
        ...state,
        locale: action.payload.locale ?? state.locale,
        historySnapshots: action.payload.historySnapshots ?? state.historySnapshots,
        activeSession: {
          ...state.activeSession,
          layout,
          selectedModels,
          activeBotIds: ensureBotsForLayout({
            layout,
            activeBotIds: state.activeSession.activeBotIds,
            allBotIds: mockBotDefinitions.map((bot) => bot.id),
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
          layout: action.payload,
          activeBotIds: ensureBotsForLayout({
            layout: action.payload,
            activeBotIds: state.activeSession.activeBotIds,
            allBotIds: mockBotDefinitions.map((bot) => bot.id),
          }),
        },
      };
    case 'replace-active-session':
      return {
        ...state,
        activeSession: action.payload,
        currentView: { mode: 'active', sessionId: action.payload.id },
      };
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
    case 'push-history-snapshot':
      return {
        ...state,
        historySnapshots: [action.payload, ...state.historySnapshots],
      };
  }
}
