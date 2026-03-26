import type { AppState } from '../types/app';
import type { ChatSession, SessionSnapshot } from '../types/session';
import { getVisibleBotIds } from '../features/layout/layoutService';

export function selectCurrentSessionRecord(state: AppState): ChatSession | SessionSnapshot {
  if (state.currentView.mode === 'history') {
    return (
      state.historySnapshots.find((snapshot) => snapshot.id === state.currentView.sessionId) ??
      state.historySnapshots[0] ??
      state.activeSession
    );
  }

  return state.activeSession;
}

export function selectVisibleBotIds(state: AppState): string[] {
  const currentSession = selectCurrentSessionRecord(state);
  return getVisibleBotIds(currentSession.activeBotIds, currentSession.layout);
}

export function selectHasVisibleLoadingMessages(state: AppState): boolean {
  if (state.currentView.mode !== 'active') {
    return false;
  }

  const visibleBotIds = getVisibleBotIds(state.activeSession.activeBotIds, state.activeSession.layout);

  return state.activeSession.messages.some(
    (message) =>
      message.role === 'assistant' &&
      message.status === 'loading' &&
      !!message.botId &&
      visibleBotIds.includes(message.botId),
  );
}
