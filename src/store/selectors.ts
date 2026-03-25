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
